import { useEffect, useState, useRef } from "react";
import type { Deck, FlashCard as FlashCardType } from "../../types";
import { useNavigate, useParams, Link } from "react-router-dom";

import { FlashCard } from "../../components";
import { deckAPI, flashcardAPI } from "../../services/api";
import { Scheduler } from "../../services/scheduler";

export default function DeckStudy() {
    const [deck, setDeck] = useState<Deck | null>(null)
    const { deckId } = useParams<{ deckId: string }>()
    const navigate = useNavigate()
    const [cards, setCards] = useState<FlashCardType[]>([])
    
    // Scheduler state
    const schedulerRef = useRef<Scheduler | null>(null)
    const [currentCard, setCurrentCard] = useState<FlashCardType | null>(null)
    const [reviewedCount, setReviewedCount] = useState(0)

    const [loading, setLoading] = useState(true)
    const [studyComplete, setStudyComplete] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                const [fetchedDeck, fetchedCards] = await Promise.all([
                    deckAPI.getDeck(Number(deckId)),
                    flashcardAPI.getDeckCards(Number(deckId))
                ])

                setDeck(fetchedDeck)
                setCards(fetchedCards)

                if (fetchedCards.length > 0) {
                    const deckCreatedAtEpoch = Math.floor(new Date(fetchedDeck.createdAt).getTime() / 1000)
                    const sched = new Scheduler(fetchedDeck.id, deckCreatedAtEpoch, fetchedCards, 0)
                    schedulerRef.current = sched
                    
                    const firstCard = sched.getCard()
                    if (firstCard) {
                        setCurrentCard(firstCard)
                    } else {
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
            console.log(`Card ${currentCard.id} rated with ease ${ease}`)

            const nextCard = schedulerRef.current.getCard()
            if (nextCard) {
                setCurrentCard(nextCard)
            } else {
                setStudyComplete(true)
                // Sync all updated cards to backend
                await flashcardAPI.syncCards(deck.id, cards)
            }
        } catch (error) {
            console.error('Failed to rate card:', error)
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

    // Study Complete Screen
    if (studyComplete) {
        return (
            <div className="min-h-screen bg-neutral-50 center p-4">
                <div className="card max-w-md w-full animate-scale-in">
                    <div className="card-body text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full center mx-auto mb-4">
                            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>

                        <h2 className="mb-2">Study Session Complete! 🎉</h2>
                        <p className="text-neutral-600 mb-6">
                            You've reviewed {reviewedCount} cards in this deck for this session.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => navigate(`/class/${deck.classId}`)}
                                className="btn-ghost w-full"
                            >
                                Back to Class
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const uncapProgress = (reviewedCount / cards.length) * 100
    const progress = Math.min(100, uncapProgress || 0)

    return (
        <div className="min-h-screen bg-neutral-50">
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

                        <div className="text-right">
                            <p className="text-sm font-medium text-neutral-900">
                                Reviews: {reviewedCount}
                            </p>
                            <p className="text-xs text-neutral-600">
                                Session progress
                            </p>
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
                    <FlashCard card={currentCard} onRate={handleRating} />
                ) : (
                    <div className="text-center py-12">No cards due for review!</div>
                )}
            </div>
        </div>
    )
}