import { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import type { Deck, FlashCard as FlashCardType } from "../../types";
import { useNavigate, useParams, Link } from "react-router-dom";

import { FlashCard, RelativeTime } from "../../components";
import { deckAPI, flashcardAPI } from "../../services/api";
import { Scheduler, formatNextDue } from "../../services/scheduler";
import { invalidateProgress } from "../../store/progressSlice";

export default function DeckStudy() {
    const [deck, setDeck] = useState<Deck | null>(null)
    const { deckId } = useParams<{ deckId: string }>()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [cards, setCards] = useState<FlashCardType[]>([])

    // Scheduler state
    const schedulerRef = useRef<Scheduler | null>(null)
    const [currentCard, setCurrentCard] = useState<FlashCardType | null>(null)
    const [reviewedCount, setReviewedCount] = useState(0)
    
    // Session progress state
    const [initialSessionCount, setInitialSessionCount] = useState(0)
    const [sessionCounts, setSessionCounts] = useState({ newCount: 0, learningCount: 0, reviewCount: 0, totalLeft: 0 })

    const [loading, setLoading] = useState(true)
    const [studyComplete, setStudyComplete] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [nextDueTime, setNextDueTime] = useState<number | null>(null)
    const [isQueueDrawerOpen, setIsQueueDrawerOpen] = useState(false)

    // Refs for unmount syncing
    const deckRef = useRef<Deck | null>(null)
    const cardsRef = useRef<FlashCardType[]>([])
    const syncNeededRef = useRef(false)

    useEffect(() => {
        deckRef.current = deck
        cardsRef.current = cards
    }, [deck, cards])

    // Cleanup and window close sync
    useEffect(() => {
        const syncProgress = () => {
            if (syncNeededRef.current && deckRef.current && cardsRef.current.length > 0) {
                flashcardAPI.syncCards(deckRef.current.id, cardsRef.current).catch(err => console.error("Sync on exit failed:", err))
                syncNeededRef.current = false
                dispatch(invalidateProgress()) // Inform Redux on unmount
            }
        }

        const handleBeforeUnload = () => {
            syncProgress()
        }

        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
            syncProgress()
        }
    }, [])

    useEffect(() => {

        // Reset state when deck changes
        schedulerRef.current = null
        setCurrentCard(null)
        setReviewedCount(0)
        setStudyComplete(false)
        setCards([])
        setDeck(null)

        const fetchData = async () => {
            try {
                setLoading(true)

                const fetchedCards = await flashcardAPI.getDeckCards(Number(deckId))
                const fetchedDeck = await deckAPI.getDeck(Number(deckId))  // now has real crt

                setDeck(fetchedDeck)
                setCards(fetchedCards)

                console.log("Fetched deck:", fetchedDeck)
                console.log("Fetched cards:", fetchedCards)

                if (fetchedCards.length > 0) {
                    const sched = new Scheduler(fetchedDeck.id, fetchedDeck.crt, fetchedCards, 0)
                    schedulerRef.current = sched

                    const initialCounts = sched.getSessionCardCounts()
                    setSessionCounts(initialCounts)
                    setInitialSessionCount(initialCounts.totalLeft)

                    const firstCard = sched.getCard()
                    if (firstCard) {
                        setCurrentCard(firstCard)
                        // update counts after first card is pulled (optional, usually counts don't drop until rated)
                        setSessionCounts(sched.getSessionCardCounts())
                    } else {
                        setNextDueTime(sched.getNextDueDate())
                        setStudyComplete(true)
                    }
                } else {
                    setStudyComplete(true)
                }

            }
            catch (error) {
                console.error("Failed to fetch deck data", error)
            }
            finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [deckId])

    const handleRating = async (ease: 1 | 2 | 3 | 4) => {
        if (!schedulerRef.current || !currentCard || !deck) return;

        try {
            schedulerRef.current.answerCard(currentCard, ease)
            setReviewedCount(prev => prev + 1)
            syncNeededRef.current = true
            console.log(`Card ${currentCard.id} rated with ease ${ease}`)

            const nextCard = schedulerRef.current.getCard()
            setSessionCounts(schedulerRef.current.getSessionCardCounts())
            if (nextCard) {
                setCurrentCard(nextCard)
            } else {
                setNextDueTime(schedulerRef.current.getNextDueDate())
                setStudyComplete(true)
                // Sync all updated cards to backend
                await flashcardAPI.syncCards(deck.id, cards)
                syncNeededRef.current = false
                dispatch(invalidateProgress()) // Tell Redux to refetch stats on next view
            }
        } catch (error) {
            console.error('Failed to rate card:', error)
        }
    }

    const handleEndSession = async () => {
        if (!deck) return
        
        try {
            setSyncing(true)
            if (syncNeededRef.current) {
                await flashcardAPI.syncCards(deck.id, cards)
                syncNeededRef.current = false
                dispatch(invalidateProgress()) // Tell Redux to refetch stats on next view
            }
            if (schedulerRef.current) {
                setNextDueTime(schedulerRef.current.getNextDueDate())
            }
            setStudyComplete(true)
        } catch (error) {
            console.error("Failed to sync on end session", error)
        } finally {
            setSyncing(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 center">
                <div className="spinner"></div>
            </div>
        )
    }

    if (!deck) {
        return (
            <div className="min-h-screen bg-neutral-50 center">
                <div className="text-center">
                    <h2>Deck not found</h2>
                    <Link to="/dashboard" className="link">Back to dashboard</Link>
                </div>
            </div>
        )
    }

    const progress = initialSessionCount > 0 
        ? Math.max(0, Math.min(100, ((initialSessionCount - sessionCounts.totalLeft) / initialSessionCount) * 100))
        : 100

    return (
        <div className="min-h-screen bg-neutral-50 relative">
            {/* Header */}
            <div className="bg-white border-b border-neutral-200">
                <div className="container-custom py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <Link
                                to={`/class/${deck.classId}`}
                                className="text-neutral-600 hover:text-neutral-900"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Link>

                            <div>
                                <h3 className="font-bold text-neutral-900">{deck.title}</h3>
                                <p className="text-sm text-neutral-600">{deck.className}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex gap-4 mr-4">
                                <div className="text-center">
                                    <p className="text-sm font-bold text-blue-600">{sessionCounts.newCount}</p>
                                    <p className="text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">New</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-orange-500">{sessionCounts.learningCount}</p>
                                    <p className="text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">Learn</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-emerald-600">{sessionCounts.reviewCount}</p>
                                    <p className="text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">Due</p>
                                </div>
                            </div>
                            <div className="text-right border-l border-neutral-200 pl-6">
                                <p className="text-sm font-medium text-neutral-900">
                                    {initialSessionCount - sessionCounts.totalLeft} / {initialSessionCount}
                                </p>
                                <p className="text-xs text-neutral-600">
                                    Cards done
                                </p>
                            </div>

                            <button
                                onClick={() => setIsQueueDrawerOpen(true)}
                                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                                title="View Queue"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <button
                                onClick={handleEndSession}
                                disabled={syncing}
                                className="px-4 py-2 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {syncing ? (
                                    <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
                                ) : null}
                                End Session
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div
                            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>             
                </div>
            </div>

            {/* Flashcard Area */}
            <div className="container-custom py-12">
                {currentCard ? (
                    <FlashCard card={currentCard} onRate={handleRating} buttonValues={schedulerRef.current?.getButtonValues(currentCard)} />
                ) : (
                    <div className="text-center py-12">No cards due for review!</div>
                )}
            </div>

            {/* Study Complete Modal */}
            {studyComplete && (
                <div className="fixed inset-0 bg-black/50 center z-50 p-4">
                    <div className="card max-w-md w-full animate-scale-in bg-white">
                        <div className="card-body text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full center mx-auto mb-4">
                                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>

                            <h2 className="mb-2">Study Session Complete! 🎉</h2>
                            <p className="text-neutral-600 mb-6">
                                {reviewedCount > 0 
                                    ? `You've reviewed ${reviewedCount} cards in this deck for this session.`
                                    : "You've already studied everything for now!"}
                            </p>

                            {nextDueTime !== null && (
                                <div className="bg-neutral-50 rounded-lg p-3 mb-6 inline-block w-full text-center border border-neutral-200">
                                    <p className="text-sm text-neutral-600">
                                        Next review available: <span className="font-semibold text-neutral-900"><RelativeTime timestampSeconds={nextDueTime} /></span>
                                    </p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate(`/class/${deck.classId}`)}
                                    className="btn-primary w-full"
                                >
                                    Back to Class
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Queue Drawer */}
            {isQueueDrawerOpen && (
                <>
                    <div 
                        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
                        onClick={() => setIsQueueDrawerOpen(false)}
                    />
                    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col">
                        <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
                            <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                Upcoming Queue
                            </h3>
                            <button 
                                onClick={() => setIsQueueDrawerOpen(false)}
                                className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200 rounded"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/50">
                            {schedulerRef.current?.getUpcomingQueue().map((card, i) => {
                                const queueType = card.queue;
                                const isReview = queueType === 'REVIEW';
                                const isNew = queueType === 'NEW';
                                const colorClass = isNew ? 'text-blue-600 bg-blue-50 border-blue-100' : 
                                                 isReview ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 
                                                 'text-orange-600 bg-orange-50 border-orange-100';
                                
                                return (
                                    <div key={card.id + i} className={`p-3 rounded-lg border text-sm flex justify-between items-center bg-white shadow-sm`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${isNew ? 'bg-blue-500' : isReview ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                                            <span className="font-medium text-neutral-700 max-w-[140px] truncate">
                                                {card.front.replace(/[#*_]/g, '').slice(0, 20) || 'Empty card'}...
                                            </span>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
                                            {isReview ? 'Due Today' : isNew ? 'New' : formatNextDue(card.due).replace('in ', '')}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {(!schedulerRef.current?.getUpcomingQueue() || schedulerRef.current?.getUpcomingQueue().length === 0) && (
                                <div className="text-center py-8 text-neutral-500 text-sm">
                                    No cards currently in queue
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
