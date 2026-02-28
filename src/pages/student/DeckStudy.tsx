import { useEffect, useState } from "react";
import type { Deck, FlashCard as FlashCardType } from "../../types";
import { useNavigate, useParams, Link } from "react-router-dom";

import { FlashCard } from "../../components";

export default function DeckStudy() {
    const [deck, setDeck] = useState<Deck | null>(null)
    const { deckId } = useParams<{ deckId: string }>()
    const navigate = useNavigate()
    const [cards, setCards] = useState<FlashCardType[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [studyComplete, setStudyComplete] = useState(false)


    useEffect(() => {
        setTimeout(() => {
            setDeck({
                id: Number(deckId),
                title: 'Chapter 1: Cell Structure',
                description: 'Learn about cell organelles and functions',
                classId: 1,
                className: 'Biology 101',
                cardCount: 5,
                studiedCount: 0,
                dueCount: 5,
                createdAt: '2024-01-16'
            })


            setCards([
                {
                    id: 1,
                    deckId: Number(deckId),
                    front: 'What is the function of the mitochondria?',
                    back: 'The mitochondria is the powerhouse of the cell, responsible for producing ATP through cellular respiration.',
                    note: 'Remember: "Mighty mitochondria makes ATP!"',
                    difficulty: 'MEDIUM',
                    nextReviewDate: '2024-02-20',
                    repetitions: 0,
                    easeFactor: 2.5
                },
                {
                    id: 2,
                    deckId: Number(deckId),
                    front: 'What is the cell membrane composed of?',
                    back: 'The cell membrane is composed of a phospholipid bilayer with embedded proteins.',
                    difficulty: 'EASY',
                    nextReviewDate: '2024-02-20',
                    repetitions: 0,
                    easeFactor: 2.5
                },
                {
                    id: 3,
                    deckId: Number(deckId),
                    front: 'What is the function of ribosomes?',
                    back: 'Ribosomes are responsible for protein synthesis by translating mRNA into amino acid chains.',
                    note: 'Can be free-floating or attached to the ER',
                    difficulty: 'MEDIUM',
                    nextReviewDate: '2024-02-20',
                    repetitions: 0,
                    easeFactor: 2.5
                }
            ])

            setLoading(false)
        }, 500)
    }, [deckId])

    const handleRating = (difficulty: 'EASY' | 'MEDIUM' | 'HARD') => {
        console.log(`Card ${cards[currentIndex].id} rated as ${difficulty}`)

        // Move to next card or complete
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1)
        } else {
            setStudyComplete(true)
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
                            You've reviewed all {cards.length} cards in this deck.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    setCurrentIndex(0)
                                    setStudyComplete(false)
                                }}
                                className="btn-primary w-full"
                            >
                                Study Again
                            </button>
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

    const currentCard = cards[currentIndex]
    const progress = ((currentIndex + 1) / cards.length) * 100

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
                                Card {currentIndex + 1} of {cards.length}
                            </p>
                            <p className="text-xs text-neutral-600">
                                {Math.round(progress)}% complete
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
                <FlashCard card={currentCard} onRate={handleRating} />
            </div>
        </div>
    )


}