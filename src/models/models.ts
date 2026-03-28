export interface Note {
  tags: string[];
}

export interface Flashcard {
  id: number;
  schedulingId: number | null;
  deckId: number;
  front: string;
  back: string;
  note: Note;
  tags: string[];
  type: 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING';
  queue: 'NEW' | 'LEARNING' | 'REVIEW' | 'SUSPENDED';
  ivl: number;
  factor: number;
  reps: number;
  lapses: number;
  left: number;
  due: number;
  dueFormatted?: string;
  dirty?: boolean;
  crtFormatted?: string;
}

export interface Deck {
  id: number;
  crt: number;
  flashcards: Flashcard[];
}
