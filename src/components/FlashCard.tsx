import type { FlashCard as FlashCardType } from "../types"
import { useState } from "react"

interface FlashCardProps {
    card: FlashCardType
    onRate: (difficulty: 'EASY' | 'MEDIUM' | 'HARD') => void
}

export default function FlashCard({ card, onRate }: FlashCardProps) {
    const [isFlipped, setIsFlipped] = useState(false)


    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Card Container */}
            <div
                className="relative h-96 cursor-pointer perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div
                    className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''
                        }`}
                >
                    {/* Front Side (Question) */}
                    <div className="absolute w-full h-full backface-hidden">
                        <div className="card h-full bg-gradient-to-br from-primary-50 to-white border-2 border-primary-200">
                            <div className="card-body h-full flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-medium text-primary-600">Question</span>
                                    <span className="text-xs text-neutral-500">Click to reveal</span>
                                </div>

                                <div className="flex-1 center p-4">
                                    <p className="text-2xl font-medium text-neutral-900 text-center">
                                        {card.front}
                                    </p>
                                </div>

                                <div className="center">
                                    <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Back Side (Answer) */}
                    <div className="absolute w-full h-full backface-hidden rotate-y-180">
                        <div className="card h-full bg-gradient-to-br from-green-50 to-white border-2 border-green-200">
                            <div className="card-body h-full flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-medium text-green-600">Answer</span>
                                    <span className="text-xs text-neutral-500">Click to flip back</span>
                                </div>

                                <div className="flex-1 center p-4">
                                    <div className="w-full">
                                        <p className="text-2xl font-medium text-neutral-900 text-center mb-4">
                                            {card.back}
                                        </p>
                                        {card.note && (
                                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                <p className="text-sm text-neutral-700">
                                                    <span className="font-medium">Note:</span> {card.note}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="center">
                                    <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rating Buttons (show only when flipped) */}
            {isFlipped && (
                <div className="mt-6 animate-slide-up">
                    <p className="text-center text-sm text-neutral-600 mb-3">
                        How well did you know this?
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onRate('HARD')
                                setIsFlipped(false)
                            }}
                            className="flex flex-col items-center gap-2 p-4 border-2 border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                            <span className="text-2xl">😰</span>
                            <span className="text-sm font-medium text-red-900">Again</span>
                            <span className="text-xs text-red-700">&lt;1 min</span>
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onRate('MEDIUM')
                                setIsFlipped(false)
                            }}
                            className="flex flex-col items-center gap-2 p-4 border-2 border-yellow-200 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                        >
                            <span className="text-2xl">🤔</span>
                            <span className="text-sm font-medium text-yellow-900">Good</span>
                            <span className="text-xs text-yellow-700">3 days</span>
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onRate('EASY')
                                setIsFlipped(false)
                            }}
                            className="flex flex-col items-center gap-2 p-4 border-2 border-green-200 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        >
                            <span className="text-2xl">😎</span>
                            <span className="text-sm font-medium text-green-900">Easy</span>
                            <span className="text-xs text-green-700">7 days</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Hint */}
            {!isFlipped && (
                <p className="text-center text-sm text-neutral-500 mt-4">
                    💡 Click the card to see the answer
                </p>
            )}
        </div>
    )
}
