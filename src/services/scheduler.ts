import type { FlashCard as Flashcard } from '../types';
import seedrandom from 'seedrandom';

class Scheduler {
  private deckCreatedAt: number;
  private flashcards: Flashcard[];

  //count the number of cards reviewd today
  private reps: number;

  //Upper limit for the number of learning cards that can be fetched in a single session
  private reportLimit = 1000;

  //days since the creation of the deck
  private today: number;

  //look-ahead cutoff for learning cards
  private lrnCutoff = 0;

  //The learn ahead limit in seconds
  private static COLLAPSE_TIME = 1200;

  //Maximum number of new cards to introduce per day
  private static NEW_CARDS_PER_DAY = 20;

  //Maximum number of review cards to show per day
  private static REVIEW_CARDS_PER_DAY = 200;

  //learning steps for NEW cards, in minutes
  private static NEW_STEPS = [1, 10];

  //learning stpes for LAPSED(relearning cards), in minutes
  private static LAPSE_STEPS = [10];

  //maximum interval(in days) for a card after a laps
  //ie when a review card is answered 'AGAIN', its interval gets reduced
  //This constant sets a floor so that interval never drops below 1 day
  private static LAPSE_MIN_IVL = 1;

  //Multiplier applied to the current interval after a lapse
  //Zero means the interval resets to LAPSE_MIN_IVL
  //A value of 0.5 would halve the interval
  private static LAPSE_MULT = 0;

  //Number of lapses before a card is considered a 'leech'
  private static LEECH_FAILS = 8;

  //The initial ease factor assigned to a card when it graduates
  //from NEW -> REVIEW for the first time
  //2500 means the interval will be multiplied by 2.5
  //the next time the user presses 'GOOD'
  private static INITIAL_FACTOR = 2500;

  //The interval(in days) assigned to a card when it graduates from
  //learning after completing all steps ("Good" on the last step)
  private static GRADUATING_IVL = 1;

  //The interval(in days) assigned to a card when it graduates early
  //by pressing EASY during learning
  private static EASY_IVL = 4;

  //Multiplier applied to the interval
  //When the user presses HARD in a review card
  private static HARD_FACTOR = 1.2;

  //Multiplier applied on top of the ease factor
  //When the user presses EASY on a reivew card
  private static EASY_BONUS = 1.3;

  //Absolute maximum interval in days
  //No card will ever be scheduled further out than this
  private static MAX_IVL = 36500;

  //Constants that control when NEW cards appears in a session
  private static NEW_CARDS_DISTRIBUTE = 0;
  private static NEW_CARDS_LAST = 1;
  private static NEW_CARDS_FIRST = 2;

  private newSpread = Scheduler.NEW_CARDS_DISTRIBUTE;

  //Queue of new cards(queue = NEW), sorted by due
  //Due for new cards is the createdDate
  //The size is limited by the perDay constant
  private newQueue: Flashcard[] = [];

  //Queue of learning cards(queue = LEARNING)
  private lrnQueue: Flashcard[] = [];

  //Queue of review cards(queue = REVIEW) that are due today, shuffled
  private revQueue: Flashcard[] = [];

  //Collection of dirty cards that need to be submitted to the server
  private dirtyCards: Flashcard[] = [];

  //Determines how often a new card is inserted between review and learning cards
  private newCardModulus = 0;

  constructor(_deckId: number, deckCreatedAtEpoch: number, flashcards: Flashcard[], reps: number = 0) {
    this.deckCreatedAt = deckCreatedAtEpoch;
    this.flashcards = flashcards;
    this.reps = reps;
    this.today = this.daysSinceCreation();
    this.reset();
  }

  /**
   * Returns how many full days have passed since the parent Deck
   * was created.
   *
   * We implement this:
   *   (currentEpochSeconds − deck.crt) / 86400   (integer division)
   *
   * @returns number of elapsed days (≥ 0).
   */
  private daysSinceCreation(): number {
    const nowSeconds = Math.floor(Date.now() / 1000); // current epoch seconds
    const crt = this.deckCreatedAt; // collection creation (epoch s)

    // 86400 seconds = 1 day
    const daysSinceCreation = Math.floor((nowSeconds - crt) / 86400);
    console.log('DEBUG: daySinceCreationVariable = ' + daysSinceCreation);
    return daysSinceCreation;
  }

  //Resets the scheduler's daily state, called by the constructor
  private reset() {
    this.resetLrn();
    //NOTE: resetRev() must be called before resetNew()
    //because resetNew() calls updateNewCardRation() to calculate the cardModulus
    this.resetRev();
    this.resetNew();
  }

  resetNew() {
    this.newQueue = [];
    this.updateNewCardRatio();
  }

  /**
   * Recalculates the learn-ahead cutoff if enough time has passed
   * (or if forced).
   *
   * Logic:
   *   • Compute a candidate cutoff = now + collapseTime (20 min).
   *   • Only apply it if it differs from the current cutoff by more
   *     than 60 seconds, or if `force` is true.
   *   • This avoids recalculating too frequently while still keeping
   *     the window reasonably up-to-date.
   */
  updateLrnCutoff(force: boolean): boolean {
    const nextCutoff = Math.floor(Date.now() / 1000) + Scheduler.COLLAPSE_TIME;
    /* Has the window shifted forward by more than 60 seconds?
     *  OR is it forced, if yes then update the lrnCutoff
     */
    if (nextCutoff - this.lrnCutoff > 60 || force) {
      this.lrnCutoff = nextCutoff;
      return true;
    }
    return false;
  }

  /**
   * Fills the new-card queue if it is empty.
   *
   * Logic (mirrors Anki):
   *   1. If the queue already has cards, return true immediately (no work needed).
   *   2. Otherwise, find all cards in the deck whose queue == NEW.
   *   3. Sort them by {@code due} (which equals the note id for new cards,
   *      so they appear in creation order).
   *   4. Trim to the daily limit: NEW_CARDS_PER_DAY.
   *   5. Return true if there are cards to study, false otherwise.
   *
   * @returns true if the new-card queue is non-empty after filling.
   */
  fillNew(): boolean {
    // Already have cards? Nothing to do.
    if (this.newQueue.length > 0) {
      return true;
    }

    // Daily limit for new cards
    const limit = Scheduler.NEW_CARDS_PER_DAY;

    // Filter: only cards sitting in the NEW queue (queue == 0).
    // Sort:   by due (for the new cards, due date = note.crt, set by the backend)
    // Limit:  take at most `limit` cards.
    this.newQueue = this.flashcards
      .filter((card) => card.queue === 'NEW')
      .sort((a, b) => b.due - a.due)
      .slice(0, limit);

    return this.newQueue.length > 0;
  }

  /**
   * Determines how often a new card should appear among review cards.
   *
   * When {@code newSpread == NEW_CARDS_DISTRIBUTE}:
   *   ratio = (newCount + revCount) / newCount
   *   If there are review cards, enforce ratio ≥ 2 so that at least
   *   one review card appears between every two new cards.
   */
  private updateNewCardRatio(): void {
    if (this.newSpread === Scheduler.NEW_CARDS_DISTRIBUTE) {
      if (this.newQueue.length > 0) {
        const newCount = this.newQueue.length;

        // NOTE: resetRev() is called before resetNew() which in turn calls this method.
        // Therefore, the review queue has already been populated.
        const revCount = this.revQueue ? this.revQueue.length : 0;

        this.newCardModulus = Math.floor((newCount + revCount) / newCount);

        // If there are review cards, make sure we don't show two
        // new cards in a row — enforce a minimum modulus of 2.
        if (revCount > 0) {
          this.newCardModulus = Math.max(2, this.newCardModulus);
        }

        return;
      }
    }

    // Default: do not distribute new cards
    this.newCardModulus = 0;
  }

  private resetLrn() {
    this.updateLrnCutoff(true);
    this.lrnQueue = [];
  }

  /**
   * Fills the learning queue if it is empty.
   *
   * Logic :
   *   1. If the queue already has cards, return true.
   *   2. Compute a cutoff = now + collapseTime (learn-ahead window).
   *   3. Find all cards whose queue == LEARNING  due < cutoff.
   *   4. Sort by id (≈ creation timestamp, so older learning cards first).
   *   4. Sorted by the due date instead(changed from the original implementation)
   *   5. Trim to reportLimit.
   */
  fillLrn(lookAhead = false): boolean {
    if (this.lrnQueue.length > 0) {
      return true;
    }

    // How far into the future we're willing to look for learning cards.
    let cutoff: number;
    if(lookAhead) {
      this.resetLrn();
      cutoff = this.lrnCutoff;
    } else {
      cutoff = Math.floor(Date.now() / 1000);
    }

    // ORIGINAL
    // Filter: queue == LEARNING *and* due timestamp hasn't passed the cutoff.
    // Sort:   by card.id (= creation timestamp → FIFO order).
    // Limit:  reportLimit.

    // NEW FIX: sort by due date
    this.lrnQueue = this.flashcards
      .filter((card) => card.queue === 'LEARNING' && card.due < cutoff)
      .sort((a, b) => b.due - a.due)
      .slice(0, this.reportLimit);

    return this.lrnQueue.length > 0;
  }

  private resetRev() {
    this.revQueue = [];
  }

  /**
   * Fills the review queue if it is empty.
   *
   * Logic:
   *   1. If the queue already has cards, return true.
   *   2. Find all cards whose queue == REVIEW **and** due <= today.
   *      (due for review cards is a day-offset relative to the collection's
   *       creation time, so we compare against {@code this.today}.)
   *   3. Sort by due date.
   *   4. Trim to daily limit: min(queueLimit, REVIEW_CARDS_PER_DAY).
   *   5. Shuffle the result using a deterministic seed (= today)
   *      so that the order is randomised but reproducible within the
   *      same day.
   *
   * @returns true if the review queue is non-empty after filling.
   */
  private fillRev(): boolean {
    if (this.revQueue.length > 0) {
      return true;
    }

    const limit = Scheduler.REVIEW_CARDS_PER_DAY;

    // Filter: queue == REVIEW and due day has arrived (due <= today).
    // Sort:   by due (so oldest-due cards are picked first).
    // Limit:  daily cap.
    this.revQueue = this.flashcards
      .filter((card) => card.queue === 'REVIEW' && card.due <= this.today)
      .sort((a, b) => a.due - b.due)
      .slice(0, limit);

    //TODO: fix this, i did npm install seedrandom
    if (this.revQueue.length > 0) {
      // Shuffle with a seed = today so the order is random but
      // consistent within the same day (restarting the app doesn't
      // re-shuffle).
      const rng = seedrandom(String(this.today));

      this.revQueue.sort(() => rng() - 0.5);

      return true;
    }

    return false;
  }

  // =====================================================================
  //  CARD RETRIEVAL — public API
  // =====================================================================

  /**
   * Returns the next card to study, or `null` if the session is over.
   *
   * `reps` counter is incremented — this counter drives the
   * new-card distribution logic (`timeForNewCard()`).
   *
   * Mirrors Anki's Scheduler.getCard().
   */
  public getCard(): Flashcard | null {
    if (this.dirtyCards.length > 3) {
      console.log('DEBUG(returning new card): reps' + this.reps);
      console.log(this.dirtyCards);
    }
    const card = this.getCardInternal();
    if (card !== null) {
      // Increment the session counter.  This is used by
      // timeForNewCard() to decide when to interleave a new card.
      this.reps += 1;
      return card;
    }
    console.log('DEBUG: session finished, comeback later');
    // No cards left — study session is complete.
    return null;
  }

  // =====================================================================
  //  CARD RETRIEVAL — internal logic
  // =====================================================================

  /**
   * Core card-selection logic.  Tries the queues in a carefully chosen
   * order that mirrors Anki's priority:
   *
   *   1. Learning cards that are due right now   (highest priority)
   *   2. New cards — IF it's "time" for one       (interleave / first)
   *   3. Review cards
   *   4. New cards — any remaining                (catch-all)
   *   5. Learning cards — with collapse           (look-ahead window)
   *
   * The first non-null result wins.
   *
   * Mirrors Anki's Scheduler._getCard().
   *
   * @returns the next due card, or `null` if nothing is available.
   */
  private getCardInternal(): Flashcard | null {
    // 1. Learning card due right now?
    let c = this.getLrnCard();
    if (c !== null) return c;

    // 2. Is it time to show a new card (distribute / first)?
    if (this.timeForNewCard()) {
      c = this.getNewCard();
      if (c !== null) return c;
    }

    // 3. Review card due today?
    c = this.getRevCard();
    if (c !== null) return c;

    // 4. Any new cards left (covers NEW_CARDS_LAST and exhausted reviews)?
    c = this.getNewCard();
    if (c !== null) return c;

    // 5. Collapse: look ahead for learning cards within the collapse window.
    //    This avoids ending the session when a learning card is almost due.
    c = this.getLrnCardWithReset();
    return c; // may be null → session over
  }

  // ── new cards ──────────────────────────────────────────────────────────

  /**
   * Pops and returns the next new card from the queue, or `null`.
   *
   * The queue is lazily filled by `fillNew()` the first time
   * this method is called.
   *
   */
  private getNewCard(): Flashcard | null {
    if (this.fillNew()) {
      // Pop the last element (most efficient for an array).
      return this.newQueue.pop() || null;
    }
    return null;
  }

  /**
   * Decides whether it is time to show a new card right now.
   *
   * The decision depends on the `newSpread` setting:
   *   - NEW_CARDS_LAST       → never (new cards come after reviews).
   *   - NEW_CARDS_FIRST      → always (new cards come before reviews).
   *   - NEW_CARDS_DISTRIBUTE → yes if  reps % newCardModulus == 0
   *                            (i.e. every N-th card is a new card).
   *
   * @returns true if a new card should be shown now.
   */
  private timeForNewCard(): boolean {
    // No new cards available? Nothing to decide.
    if (this.newQueue.length === 0 && !this.fillNew()) return false;

    if (this.newSpread === Scheduler.NEW_CARDS_LAST) {
      // New cards are shown only after all reviews are done.
      return false;
    } else if (this.newSpread === Scheduler.NEW_CARDS_FIRST) {
      // New cards are shown before any reviews.
      return true;
    } else {
      // NEW_CARDS_DISTRIBUTE:
      // Show a new card every `newCardModulus` reviews.
      // reps is 0-based at this point so the very first card (reps==0)
      // won't match; that's fine — a learning/review card goes first.
      return this.newCardModulus !== 0 && this.reps > 0 && this.reps % this.newCardModulus === 0;
    }
  }

  // ── learning cards ────────────────────────────────────────────────────

  /**
   * Pops and returns the next learning card from the queue, or `null`.
   */
  private getLrnCard(): Flashcard | null {
    if (this.fillLrn()) return this.lrnQueue.pop() || null;
    return null;
  }

  /**
   * resets the lrnCutoff, then the queue, and then tries to return the card
   */

  private getLrnCardWithReset(): Flashcard | null {
    // reset the lrnQueue
    if (this.fillLrn(true)) {
      return this.lrnQueue.pop() || null;
    }
    return null;
  }

  // ── review cards ──────────────────────────────────────────────────────

  /**
   * Pops and returns the next review card from the queue, or `null`.
   */
  private getRevCard(): Flashcard | null {
    if (this.fillRev()) return this.revQueue.pop() || null;
    return null;
  }

  // =====================================================================
  //  ANSWER CARD — public API
  // =====================================================================

  /**
   * Updates the given card after the user has answered.
   *
   * This is the second core method of the scheduler (alongside getCard).
   * It dispatches to a specialised handler based on the card's current queue:
   *
   *   queue == NEW      → answerNewCard(card, ease)
   *   queue == LEARNING → answerLrnCard(card, ease)
   *   queue == REVIEW   → answerRevCard(card, ease)
   *
   * Before dispatching, the card's `reps` counter is incremented in the FlashCard object (not the scheduler which also has a reps counter)
   * (total number of times this card has ever been reviewed).
   *
   * @param card the card that was reviewed.
   * @param ease the user's answer (1-based):
   *             1 = Again, 2 = Hard, 3 = Good, 4 = Easy.
   * @throws Error if ease is not in [1, 4] or the card's queue is unexpected.
   */
  // NOTE: this should be implemented in the frontend and then update time should be sent to the backend
  public answerCard(card: Flashcard, ease: number): void {
    // Validate inputs — same assertions as Anki:
    //   assert 1 <= ease <= 4
    if (ease < 1 || ease > 4) {
      throw new Error(`ease must be between 1 and 4, got: ${ease}`);
    }

    // Increment the card's total review count.
    card.reps = card.reps + 1;

    // Dispatch based on the card's current queue.
    switch (card.queue) {
      case 'NEW':
        // Brand-new card being seen for the first time.
        this.answerNewCard(card, ease);
        break;

      case 'LEARNING':
        // Card is in the learning (or relearning) queue.
        this.answerLrnCard(card, ease);
        break;

      case 'REVIEW':
        // Card is in the review queue.
        this.answerRevCard(card, ease);
        break;

      default:
        throw new Error(`Unexpected card queue: ${card.queue}`);
    }
    this.markCardDirty(card);
  }

  // =====================================================================
  //  ANSWERING NEW CARDS
  // =====================================================================

  /**
   * Handles answering a card that is currently in the NEW queue.
   *
   * What happens:
   *   1. Move the card from the NEW queue to the LEARNING queue.
   *   2. Set the card type to LEARNING.
   *   3. Initialise the `left` field which encodes how many
   *      learning steps remain (both for today and until graduation).
   *
   * After this method, the card is in the learning pipeline and will
   * be handled by answerLrnCard on subsequent reviews.
   *
   * @param card the new card being answered.
   * @param ease the user's answer (1–4). Not used for new cards because
   *             the card always moves to LEARNING regardless of ease.
   */

  private answerNewCard(card: Flashcard, ease: number): void {
    // Move from the NEW queue → LEARNING queue.
    card.queue = 'LEARNING';
    console.log(`DEBUG: card queue set to ${card.queue}` )

    card.type = 'LEARNING';
    console.log(`DEBUG: card type set to ${card.type}` )

    // Initialise the learning-steps counter.
    // This tells the scheduler how many steps are left before
    // the card graduates to the REVIEW queue.
    // NOTE: this sets the left to the first step of the learning steps
    card.left = this.startingLeft(card);

    // NOTE: after initializations, answer like a learning card i.e. if 'easy' was clicked, graduate the card and stuffs
    this.answerLrnCard(card, ease);
  }

  private markCardDirty(card: Flashcard) {
    card.dirty = true;
    this.dirtyCards.push(card);
  }

  // =====================================================================
  //  LEARNING-STEP HELPERS
  // =====================================================================

  /**
   * Returns the learning-step delays for the given card.
   *
   * If the card is (re-)learning after a lapse (type == REVIEW or
   * type == RELEARNING) it uses LAPSE_STEPS.
   * Otherwise it uses NEW_STEPS.
   *
   * @param card the card.
   * @return the array of step delays in minutes.
   */
  private lrnConf(card: Flashcard): number[] {
    // If the card was previously a review card (lapse), use lapse steps.
    // Otherwise use new-card steps.
    if (card.type === 'REVIEW' || card.type === 'RELEARNING') {
      return Scheduler.LAPSE_STEPS;
    }
    return Scheduler.NEW_STEPS;
  }

  /**
   * Computes the initial value of the `left` field for a card
   * that is entering the learning queue.
   *
   * @param card the card entering the learning queue.
   * @return left value.
   */
  private startingLeft(card: Flashcard): number {
    const delays = this.lrnConf(card);
    const total = delays.length;
    return total;
  }

  // =====================================================================
  //  ANSWERING LEARNING CARDS
  // =====================================================================

  /**
   * Handles answering a card that is currently in the LEARNING queue.
   *
   * Dispatches to one of four actions based on the ease button:
   *
   *   ease 4 (Easy)  → immediately graduate to review queue.
   *   ease 3 (Good)  → advance to the next step; if no steps remain,
   *                     graduate to review.
   *   ease 2 (Hard)  → repeat the current step (same delay again).
   *   ease 1 (Again) → go back to the first step.
   *
   * @param card the learning card being answered.
   * @param ease 1=Again, 2=Hard, 3=Good, 4=Easy.
   */
  // NOTE: when a learning card is answered:
  private answerLrnCard(card: Flashcard, ease: number): void {
    const conf = this.lrnConf(card);

    if (ease === 4) {
      // "Easy" — skip remaining steps and graduate immediately.
      this.rescheduleAsRev(card, conf, true);
    } else if (ease === 3) {
      // "Good" — check if the card has finished all its steps.
      // card.left % 1000 gives the total steps remaining.
      // If only 1 (or 0) step remains, the card graduates.
      if (card.left == 1) {
        // No more steps → graduate to review.
        this.rescheduleAsRev(card, conf, false);
      } else {
        // More steps remain → move to the next one.
        this.moveToNextStep(card, conf);
      }
    } else if (ease === 2) {
      // "Hard" — repeat the current step with the same delay.
      // NOTE: The current card step is repeated. This means the attribute `left` is unchanged. We still have the same number of steps before graduation.
      // NOTE: The difference is that the card will be scheduled in a delay slightly longer than the previous one. We average the last and next delays [Ex: 1m 10m 20m and we are at step 2 => repeat in 15m)
      this.repeatStep(card, conf);
    } else {
      // ease === 1, "Again" — back to the very first step.

      // NOTE: We restore the attribute 'left' as if the card were new
      // NOTE: We process lapses differently (the RELEARNING cards probably). By default we reset the attribute ivl to 1 (next review in one day) (ivl is only applicable for review cards, no?)
      // NOTE: The card due date is determined by adding the next step to the current date. The card remains in the learning queue (1). (Since the left was set as if the card were new, we are back to the first step.)
      // NOTE: The delayForGrade() is a helper method to get the next step (to calculate the due date). This method extracts the number of remaining steps from the attribute 'left' (Ex: 1002 => 2 remaining steps) and uses the setting delay to find the matching delay (Ex: 1m 10m 1d => next study in 10m)
      this.moveToFirstStep(card, conf);
    }
  }

  // ── Again (ease 1) ────────────────────────────────────────────────────

  /**
   * Moves the card back to the first learning step.
   *
   * @param card the card to reset.
   * @param conf the step delays array (minutes).
   */
  private moveToFirstStep(card: Flashcard, conf: number[]): void {
    // Reset the steps counter as if the card is freshly entering learning.
    card.left = this.startingLeft(card);

    // If this is a relearning card (a review card that lapsed),
    // reduce its review interval to reflect the failure.
    if (card.type === 'RELEARNING') {
      this.updateRevIvlOnFail(card);
    }

    // Schedule the card for the first step's delay.
    this.rescheduleLrnCard(card, conf, null);
  }

  /**
   * After a lapse ("Again" on a relearning card), reduce the card's
   * review interval.
   *
   * @param card the lapsed card.
   */
  private updateRevIvlOnFail(card: Flashcard): void {
    card.ivl = this.lapseIvl(card);
    console.log(`DEBUG: ivl value set to ${card.ivl} days` )
  }

  /**
   * Computes the new interval for a card after a lapse.
   *
   * Formula:  max(1, minInt, ivl × mult)
   *
   * With the default settings (mult=0, minInt=1) this always returns 1,
   * meaning the card's interval resets to 1 day.
   *
   * @param card the lapsed card.
   * @return the new interval in days (≥ 1).
   */
  private lapseIvl(card: Flashcard): number {
    const ivl = Math.floor(card.ivl * Scheduler.LAPSE_MULT);
    return Math.max(1, Math.max(Scheduler.LAPSE_MIN_IVL, ivl));
  }

  // ── Scheduling helpers ────────────────────────────────────────────────

  /**
   * Reschedules a learning card: sets its due date and keeps it in
   * the LEARNING queue.
   *
   * If `delay` is `null`, the delay is derived from the
   * card's current step using delayForGrade.
   *
   * @param card  the card to reschedule.
   * @param conf  the step delays array (minutes).
   * @param delay override delay in seconds, or `null` to
   *              use the current step's delay.
   * @return the delay that was applied (in seconds).
   */
  private rescheduleLrnCard(card: Flashcard, conf: number[], delay: number | null): number {
    if (delay === null) {
      delay = this.delayForGrade(conf, card.left);
    }

    // Set due = now + delay (epoch seconds).
    card.due = Math.floor(Date.now() / 1000) + delay!;
    console.log(`DEBUG: due value ${delay} seconds from now` )

    // Keep (or move) the card in the learning queue.
    card.queue = 'LEARNING';
    console.log(`DEBUG: card queue set to ${card.queue}` )

    return delay;
  }

  /**
   * Returns the delay in seconds for the current learning step.
   *
   * Extracts the number of remaining steps from `left`
   * and looks up the matching delay from the conf array.
   *
   * NOTE: since we simplified startingLeft() to not use the *1000 encoding,
   * `left` is directly the number of remaining steps.
   *
   * @param conf the step delays array (in minutes).
   * @param left the card's left field (steps remaining).
   * @returns delay in seconds.
   */
  private delayForGrade(conf: number[], left: number): number {
    // left is directly the number of steps remaining.
    const stepsRemaining = left;

    if (stepsRemaining == 0) {
      throw new Error("step can't be zero");
    }

    // For the first step, stepsRemaining = conf.length and hence 0th index is accessed.
    const delayMinutes = conf[conf.length - stepsRemaining];
    // Convert minutes → seconds.
    return delayMinutes * 60;
  }

  /**
   * Advances the card to the next learning step ("Good" button, steps remaining).
   *
   * Decrements the total-steps counter and reschedules.
   *
   * @param card the card to advance.
   * @param conf the step delays array (minutes).
   */
  private moveToNextStep(card: Flashcard, conf: number[]): void {
    // Decrement the total number of remaining steps.
    card.left = card.left - 1;

    // Reschedule with the delay for the new current step.
    this.rescheduleLrnCard(card, conf, null);
  }

  /**
   * Repeats the current learning step ("Hard" button) with a slightly longer delay.
   *
   * @param card the card to repeat.
   * @param conf the step delays array (minutes).
   */
  private repeatStep(card: Flashcard, conf: number[]): void {
    // "Hard" — repeat the current step, but with a slightly longer delay.
    // Instead of using the exact same delay, we average the current step's
    // delay with the next step's delay so the wait is a bit longer.
    const delay = this.delayForRepeatingGrade(card, conf, card.left);
    this.rescheduleLrnCard(card, conf, delay);
  }

  /**
   * Computes the delay for repeating the current step ("Hard" button).
   *
   * Takes the average of the current step's delay and the next step's delay.
   * This makes the user wait a bit longer than the current step but not as
   * long as the next step.
   *
   * Example:
   *   steps = [1, 10, 20],  currently at step 2 (10 min)
   *   delay1 = 10 min (current step)
   *   delay2 = 20 min (next step)
   *   avg = (10 + max(10, 20)) / 2 = (10 + 20) / 2 = 15 min
   *
   * If on the last step (no next step), delay2 will be the same step,
   * so the average equals the current delay.
   *
   * @param conf the step delays array (in minutes).
   * @param left the card's left field.
   * @returns delay in seconds.
   */
  private delayForRepeatingGrade(card: Flashcard, conf: number[], left: number): number {
    const delay1 = this.delayForGrade(conf, left);
    let delay2: number;

    //TODO: read below
    //NOTE: improvisation for relearning cards, where the again button causes 15 minute delay. Following logic, we will get a delay of 10 minnute, but the 'again' button aeready provides a delay of 10 minute
    if(card.type === "RELEARNING") {
      return 15 * 60;
    }

    // If this is the last step, delay2 = delay1, else delay2 = next delay option
    if (left == 1) {
      delay2 = delay1;
    } else {
      delay2 = this.delayForGrade(conf, left - 1);
    }
    // Average of current delay and the larger of the two.
    // This ensures the result is always >= delay1.
    const delaySeconds = delay1 + Math.max(delay1, delay2) / 2;
    //doing this because we want to apply ceiling on minute, not seconds
    const delayMinute = Math.ceil(delaySeconds/60);
    return delayMinute * 60;
  }

  // =====================================================================
  //  GRADUATING — move from LEARNING → REVIEW
  // =====================================================================

  /**
   * Graduates a learning card to the REVIEW queue.
   *
   * Called when:
   *   - The user presses "Easy" during learning (early = true).
   *   - The user presses "Good" on the last learning step (early = false).
   *
   * The logic differs depending on whether the card is a lapse
   * (previously a review card that was forgotten) or a genuinely new card.
   *
   * @param card  the card to graduate.
   * @param conf  the step delays array (minutes).
   * @param early true if the user pressed "Easy" (skip remaining steps).
   */
  private rescheduleAsRev(card: Flashcard, conf: number[], early: boolean): void {
    // Was this card in the review queue before it lapsed?
    // card.type tracks the *original* state: REVIEW means it was a review
    // card that failed and entered relearning.
    const lapse = card.type === 'REVIEW' || card.type === 'RELEARNING';

    if (lapse) {
      //TODO
      //NOTE: here, in relearning cards, the good option already has today + card.ivl( ie1 day) for the next due date
      //NOTE: hence, changing the due date for 'easy' option to 2 days
      card.ivl = 2;
      console.log(`DEBUG: ivl value set to ${card.ivl} days` )

      this.rescheduleGraduatingLapse(card);
    } else {
      this.rescheduleNew(card, conf, early);
    }
  }

  /**
   * Graduates a lapsed card back to the REVIEW queue.
   *
   * The interval (ivl) was already reduced by updateRevIvlOnFail
   * when the card first lapsed. We simply set the due date to
   * today + that reduced interval.
   *
   * @param card the lapsed card being graduated.
   */
  private rescheduleGraduatingLapse(card: Flashcard): void {
    // due for review cards = day offset relative to collection creation.
    card.due = this.today + card.ivl;
    console.log(`DEBUG: due value ${card.ivl} days from today` )

    card.type = 'REVIEW';
    console.log(`DEBUG: card type set to ${card.type}` )

    card.queue = 'REVIEW';
    console.log(`DEBUG: card queue set to ${card.queue}` )
  }

  /**
   * Graduates a genuinely new card to the REVIEW queue for the first time.
   *
   * Initialises the three key SRS fields:
   *   - ivl    = graduating interval (1 day for "Good", 4 days for "Easy")
   *   - due    = today + ivl
   *   - factor = initial ease factor (2500 = ×2.5)
   *
   * @param card  the new card being graduated.
   * @param conf  the step delays array (minutes) — used indirectly.
   * @param early true if graduating via "Easy" button.
   */
  private rescheduleNew(card: Flashcard, conf: number[], early: boolean): void {
    card.ivl = this.graduatingIvl(card, conf, early);
    console.log(`DEBUG: ivl value set to ${card.ivl} days` )


    card.due = this.today + card.ivl;
    console.log(`DEBUG: due value ${card.ivl} days from today` )

    card.factor = Scheduler.INITIAL_FACTOR;
    card.type = 'REVIEW';
    console.log(`DEBUG: card type set to ${card.type}` )


    card.queue = 'REVIEW';
    console.log(`DEBUG: card queue set to ${card.queue}` )
  }

  /**
   * Determines the initial interval when a card graduates to review.
   *
   * - If the card was already a review/relearning card (lapse), keep its
   *   current interval.
   * - If it's a new card graduating normally ("Good"), use GRADUATING_IVL
   *   (default 1 day).
   * - If it's a new card graduating early ("Easy"), use EASY_IVL
   *   (default 4 days).
   *
   * @param card  the card.
   * @param conf  the step delays array (not directly used here).
   * @param early true if graduating via "Easy".
   * @returns interval in days.
   */
  private graduatingIvl(card: Flashcard, _conf: number[], early: boolean): number {
    // Lapsed cards keep their existing (already-reduced) interval.
    if (card.type === 'REVIEW' || card.type === 'RELEARNING') {
      return card.ivl;
    }

    // New card graduating:
    if (!early) {
      // Completed all steps → use the normal graduating interval.
      return Scheduler.GRADUATING_IVL; // default: 1 day
    } else {
      // Pressed "Easy" → use the early-graduation interval.
      return Scheduler.EASY_IVL; // default: 4 days
    }
  }

  // =====================================================================
  //  ANSWERING REVIEW CARDS
  // =====================================================================

  /**
   * Handles answering a card that is currently in the REVIEW queue.
   *
   * Two paths:
   *   ease == 1 (Again) → the card has lapsed, handle via rescheduleLapse.
   *   ease >= 2          → the card was recalled, reschedule with a new interval.
   *
   * @param card the review card being answered.
   * @param ease 1=Again, 2=Hard, 3=Good, 4=Easy.
   */
  private answerRevCard(card: Flashcard, ease: number): void {
    if (ease === 1) {
      this.rescheduleLapse(card);
    } else {
      this.rescheduleRev(card, ease);
    }
  }

  // ── Again (ease 1) — lapse ────────────────────────────────────────────

  /**
   * Handles a lapse — the user pressed "Again" on a review card.
   *
   * What happens:
   *   1. Increment the card's lapse counter.
   *   2. Reduce the ease factor by 200 (0.2), floored at 1300 (1.3).
   *   3. Check if the card has become a leech (too many lapses).
   *   4. If NOT suspended as a leech:
   *        - Keep type = REVIEW (so lrnConf returns LAPSE_STEPS).
   *        - Move to the first learning step via moveToFirstStep.
   *   5. If suspended as a leech:
   *        - No relearning steps; just reduce the interval.
   *
   * @param card the review card that lapsed.
   */
  private rescheduleLapse(card: Flashcard): void {
    // 1. Increment lapse counter.
    card.lapses = card.lapses + 1;

    // 2. Reduce ease factor by 200 (= 0.2 in real terms).
    //    Floor at 1300 (= 1.3×) as recommended by SM-2.
    card.factor = Math.max(1300, card.factor - 200);

    // 3. Check if the card is now a leech.
    const suspended = this.checkLeech(card);

    if (!suspended) {
      // 4a. Not a leech → enter relearning.
      //     Keep type = REVIEW so that lrnConf() returns LAPSE_STEPS
      //     and rescheduleAsRev() knows this is a lapse (not a new card).
      card.type = 'RELEARNING';
      console.log(`DEBUG: card type set to ${card.type}` )

      this.moveToFirstStep(card, Scheduler.LAPSE_STEPS);
    } else {
      // 4b. Suspended as a leech → no relearning steps.
      //     Just reduce the review interval for when the user
      //     eventually unsuspends the card.
      this.updateRevIvlOnFail(card);
    }
  }

  // ── Leech detection ───────────────────────────────────────────────────

  /**
   * Checks whether a card has become a leech (too many lapses).
   *
   * A leech is a card that the user keeps forgetting. When the lapse
   * count reaches LEECH_FAILS, the card is:
   *   1. Tagged with "leech" on its note (so the user can find it).
   *   2. Suspended (queue = SUSPENDED).
   *
   * A suspended card is invisible to all fill*() methods — it won't
   * appear in any queue until the user manually unsuspends it.
   *
   * @param card the card to check.
   * @returns true if the card was suspended as a leech, false otherwise.
   */
  private checkLeech(card: Flashcard): boolean {
    if (card.lapses >= Scheduler.LEECH_FAILS) {
      // Tag the note so the user can easily find leeches.
      if (!card.tags?.includes('leech')) {
        (card.tags = card.tags || []).push('leech');
      }
      // Suspend the card — it will no longer appear in any queue.
      card.queue = 'SUSPENDED';
      console.log(`DEBUG: card queue set to ${card.queue}` )

      return true;
    }
    return false;
  }

  // ── Hard / Good / Easy (ease 2-4) — reschedule review ─────────────────

  /**
   * Reschedules a review card after a successful recall (ease >= 2).
   *
   * Two things happen:
   *   1. The interval is updated based on the ease button pressed.
   *   2. The ease factor is adjusted:
   *        Hard (-150), Good (+0), Easy (+150), floored at 1300.
   *
   * Finally, the due date is set to today + new interval.
   *
   * @param card the review card being rescheduled.
   * @param ease 2=Hard, 3=Good, 4=Easy.
   */
  private rescheduleRev(card: Flashcard, ease: number): void {
    // 1. Calculate and set the new interval.
    this.updateRevIvl(card, ease);

    // 2. Adjust the ease factor.
    //    Hard (ease=2): -150  →  factor decreases by 0.15
    //    Good (ease=3): +0    →  factor unchanged
    //    Easy (ease=4): +150  →  factor increases by 0.15
    //    Floor at 1300 (= 1.3×) as recommended by SM-2.
    const factorAdj = [-150, 0, 150];
    card.factor = Math.max(1300, card.factor + factorAdj[ease - 2]);

    // 3. Set the due date = today + new interval (day offset).
    card.due = this.today + card.ivl;
    console.log(`DEBUG: due value ${card.ivl} days from now` )



    // Keep the card in the review queue.
    card.type = 'REVIEW';
    console.log(`DEBUG: card type set to ${card.type}` )

    card.queue = 'REVIEW';
    console.log(`DEBUG: card queue set to ${card.queue}` )
  }

  /**
   * Updates the card's interval based on the ease button pressed.
   */
  private updateRevIvl(card: Flashcard, ease: number): void {
    card.ivl = this.nextRevIvl(card, ease);
    console.log(`DEBUG: ivl value set to ${card.ivl} days` )
  }

  // =====================================================================
  //  INTERVAL CALCULATION (the core of the SRS)
  // =====================================================================

  /**
   * Computes the next review interval for a card, given the ease button.
   *
   * This is the heart of the Anki algorithm. Three candidate intervals
   * are computed (one per button), and each one must be strictly greater
   * than the previous one so the buttons always offer distinct choices:
   *
   *   ivl2 (Hard):  ivl × hardFactor (1.2)
   *                 Minimum = current ivl (so it never shrinks).
   *
   *   ivl3 (Good):  (ivl + delay/2) × factor
   *                 delay/2 is a "late bonus" — if the card was overdue
   *                 and still recalled, half of the overdue days are
   *                 credited as extra interval.
   *                 Minimum = ivl2 + 1 (must be > Hard).
   *
   *   ivl4 (Easy):  (ivl + delay) × factor × easyBonus (1.3)
   *                 Full late bonus + the easy multiplier.
   *                 Minimum = ivl3 + 1 (must be > Good).
   *
   * All values are clamped to [1, MAX_IVL] by constrainedIvl().
   *
   * @param card the review card.
   * @param ease 2=Hard, 3=Good, 4=Easy.
   * @returns the new interval in days.
   */
  private nextRevIvl(card: Flashcard, ease: number): number {
    // How many days overdue is this card?
    const delay = this.daysLate(card);

    // Current ease factor as a multiplier (e.g. 2500 → 2.5).
    const fct = card.factor / 1000.0;

    // Current interval.
    const ivl = card.ivl;

    // ── Hard (ease 2) ─────────────────────────────────────────────────
    // Multiply the current interval by hardFactor (1.2).
    // Minimum = current interval (the card should never shrink on Hard
    // when hardFactor > 1).
    const hardMin = Scheduler.HARD_FACTOR > 1 ? ivl : 0;
    const ivl2 = this.constrainedIvl(ivl * Scheduler.HARD_FACTOR, hardMin);
    if (ease === 2) {
      return this.fuzzedIvl(ivl2);
    }

    // ── Good (ease 3) ─────────────────────────────────────────────────
    // (ivl + delay/2) × factor.
    // The "delay / 2" is a late bonus: if the card was overdue by 10 days
    // and still recalled, we credit 5 extra days of proven retention.
    // Minimum = ivl2 + 1  (so Good is always > Hard).
    const ivl3 = this.constrainedIvl((ivl + delay / 2.0) * fct, ivl2);
    if (ease === 3) {
      return this.fuzzedIvl(ivl3);
    }

    // ── Easy (ease 4) ─────────────────────────────────────────────────
    // (ivl + delay) × factor × easyBonus.
    // Full late bonus + the easy multiplier (1.3).
    // Minimum = ivl3 + 1  (so Easy is always > Good).
    const ivl4 = this.constrainedIvl((ivl + delay) * fct * Scheduler.EASY_BONUS, ivl3);
    return this.fuzzedIvl(ivl4);
  }

  /**
   * Returns how many days late this card was reviewed.
   *
   * If the card was reviewed on time or early, returns 0.
   * If the card was overdue by N days, returns N.
   *
   * @param card the review card.
   * @returns days late (≥ 0).
   */
  private daysLate(card: Flashcard): number {
    return Math.max(0, this.today - card.due);
  }

  /**
   * Clamps a candidate interval to valid bounds.
   *
   * Rules:
   *   - Must be at least `prev + 1` (so each ease button offers
   *     a strictly larger interval than the previous one).
   *   - Must be at least 1 day.
   *   - Must not exceed MAX_IVL.
   *
   * @param ivl  the raw candidate interval (may be fractional).
   * @param prev the interval of the previous (easier) button, or 0.
   * @returns the clamped interval in whole days.
   */
  private constrainedIvl(ivl: number, prev: number): number {
    // Must be at least prev+1 and at least 1.
    let result = Math.max(Math.floor(ivl), Math.max(prev + 1, 1));
    // Cap at the absolute maximum.
    result = Math.min(result, Scheduler.MAX_IVL);
    return result;
  }

  // =====================================================================
  //  FUZZING
  // =====================================================================

  /**
   * Applies a small random "fuzz" to a review interval.
   *
   * This prevents cards that were introduced at the same time and given
   * the same ratings from always coming up for review on the same day.
   * The fuzz amount scales with the interval:
   *
   *   ivl < 2   → no fuzz (always 1)
   *   ivl == 2  → [2, 3]
   *   ivl < 7   → ±25% of ivl
   *   ivl < 30  → ±15% of ivl (at least ±2)
   *   ivl >= 30 → ±5% of ivl  (at least ±4)
   *
   * The fuzz is always at least 1 day.
   *
   * @param ivl the interval in days (before fuzzing).
   * @returns the fuzzed interval in days.
   */
  private fuzzedIvl(ivl: number): number {
    const range = this.fuzzIvlRange(ivl);
    // Random integer in [min, max] inclusive.
    return range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
  }

  /**
   * Computes the [min, max] range for fuzzing a given interval.
   *
   * The fuzz factor decreases as intervals grow larger (so long intervals
   * don't swing wildly), but the absolute fuzz increases:
   *   - Short intervals (< 7 days):  25% fuzz
   *   - Medium intervals (< 30 days): 15% fuzz, min 2 days
   *   - Long intervals (≥ 30 days):   5% fuzz, min 4 days
   *
   * @param ivl the interval in days.
   * @returns a [min, max] tuple (inclusive).
   */
  private fuzzIvlRange(ivl: number): [number, number] {
    if (ivl < 2) {
      return [1, 1];
    } else if (ivl === 2) {
      return [2, 3];
    }

    let fuzz: number;
    if (ivl < 7) {
      fuzz = Math.floor(ivl * 0.25);
    } else if (ivl < 30) {
      fuzz = Math.max(2, Math.floor(ivl * 0.15));
    } else {
      fuzz = Math.max(4, Math.floor(ivl * 0.05));
    }

    // Fuzz at least 1 day.
    fuzz = Math.max(fuzz, 1);

    return [ivl - fuzz, ivl + fuzz];
  }


  //get the button values
  //TODO: here, the ' minutes' ' days' are hardcoded, look to simplify the logic
  getButtonValues(card: Flashcard): {
    easy: string;
    good: string;
    hard: string;
    again: string;
  } {
    let hardStep = '' ;
    let goodStep = '' ;
    let easyStep = '' ;
    let againStep = '';
    switch (card.type) {
      case 'NEW':
        easyStep = '4 day';
        goodStep = '10 minutes';
        hardStep = '6 minutes';
        againStep = '1 minute';
        break;

      case 'LEARNING':
        againStep = this.lrnConf(card)[0] + ' minutes';
        easyStep = '4 days'; //easy step is always 4

        //NOTE: cards start at conf.length and the last step is '1'
        if (card.left == 1) {
          //since this is the last step left, the next step will be graduation
          const currentStep = this.delayForGrade(this.lrnConf(card), card.left);
          //there is no next step
          const nextStep = currentStep;

          //since this is the last step
          goodStep = Scheduler.GRADUATING_IVL + ' days';
          hardStep = Math.floor((currentStep + Math.max(currentStep, nextStep)) / 2)/60 + ' minutes';
          againStep = this.lrnConf(card)[0]+ ' minute';
          easyStep = '4 days'

        } else if (card.left == 2) {
          const currentStep = this.delayForGrade(this.lrnConf(card), card.left);
          const nextStep = this.delayForGrade(this.lrnConf(card), card.left - 1);

          goodStep = nextStep/60 + ' minutes';
          hardStep = Math.ceil((currentStep + Math.max(currentStep, nextStep)) / 2/60) + ' minutes';
          againStep = this.lrnConf(card)[0] + ' minute';
          easyStep = '4 days'
        }
        break;

      case 'RELEARNING':
        againStep = this.lrnConf(card)[0] + ' minutes';
        hardStep = '15 minutes'; //NOTE: a hard-coded value for hard step in relearning cards(hard coded in delayForRepeatingGrade, read the NOTE in the method)
        goodStep = card.ivl + ' day';

        //NOTE: a hardcoded value for easy step in relearing cards(hardcoded in rescheduleAsRev, read the NOTE there)
        easyStep = '2 days';
        break;

      case 'REVIEW':
        hardStep = this.nextRevIvl(card, 2) + ' days';
        goodStep = this.nextRevIvl(card, 3) + ' days';
        easyStep = this.nextRevIvl(card, 4) + ' days';
        againStep = this.lrnConf(card)[0] + ' minutes';

        break;

      default:
        throw new Error(`Unexpected card queue: ${card.queue}`);
    }

    return {
      easy: easyStep,
      good: goodStep,
      hard: hardStep,
      again: againStep,
    };
  }
}

export { Scheduler };
