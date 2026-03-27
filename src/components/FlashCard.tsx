import { useEffect, useState } from 'react'
import type { FlashCard as FlashCardType } from '../types'
import MarkdownViewer from './MarkdownViewer'

interface FlashCardProps {
    card: FlashCardType
    onRate: (ease: 1 | 2 | 3 | 4) => void
}

export default function FlashCard({ card, onRate }: FlashCardProps) {
    const [isFlipped, setIsFlipped] = useState(false)

    const queueLabel =
        card.queue === 'NEW' ? 'New' : card.queue === 'LEARNING' ? 'Learning' : 'Review'
    const queueColor =
        card.queue === 'NEW' ? 'bg-blue-500' : card.queue === 'LEARNING' ? 'bg-orange-500' : 'bg-emerald-500'

    useEffect(() => {
        setIsFlipped(false)
    }, [card.id])

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null
            const isTypingTarget = target && (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            )

            if (isTypingTarget) {
                return
            }

            if (event.code === 'Space') {
                event.preventDefault()
                setIsFlipped((current) => !current)
                return
            }

            if (!isFlipped) {
                return
            }

            if (event.key === '1' || event.key === '2' || event.key === '3' || event.key === '4') {
                event.preventDefault()
                const ease = Number(event.key) as 1 | 2 | 3 | 4
                onRate(ease)
                setIsFlipped(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isFlipped, onRate])

    return (
        <div className="w-full px-4">
            <div className="mx-auto flex w-full justify-center">
                <div
                    className="w-fit max-w-none cursor-pointer"
                    style={{ minWidth: '800px' }}
                    onClick={() => setIsFlipped((current) => !current)}
                >
                    {!isFlipped ? (
                        <div className="card bg-gradient-to-br from-primary-50 to-white border-2 border-primary-200 transition-all duration-300 min-h-[400px]">
                            <div className="card-body flex min-h-[400px] flex-col">
                                <div className="flex items-center justify-between gap-4 pb-3 border-b border-primary-200">
                                    <span className="text-sm font-medium text-primary-600">Question</span>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-2 h-2 rounded-full ${queueColor}`}></div>
                                            <span className="text-xs font-medium text-neutral-500">{queueLabel}</span>
                                        </div>
                                        <span className="text-xs text-neutral-400">|</span>
                                        <span className="text-xs text-neutral-400">Click to reveal</span>
                                    </div>
                                </div>

                                <div className="py-4">
                                    <MarkdownViewer content={card.front} enableImageResize />
                                </div>

                                <div className="pt-3 border-t border-primary-200 center">
                                    <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card bg-gradient-to-br from-green-50 to-white border-2 border-green-200 transition-all duration-300 min-h-[400px]">
                            <div className="card-body flex min-h-[400px] flex-col">
                                <div className="flex items-center justify-between gap-4 pb-3 border-b border-green-200">
                                    <span className="text-sm font-medium text-green-600">Answer</span>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-2 h-2 rounded-full ${queueColor}`}></div>
                                            <span className="text-xs font-medium text-neutral-500">{queueLabel}</span>
                                        </div>
                                        <span className="text-xs text-neutral-400">|</span>
                                        <span className="text-xs text-neutral-400">Click to flip back</span>
                                    </div>
                                </div>

                                <div className="py-4">
                                    <MarkdownViewer content={card.back} enableImageResize />

                                    {card.note && (
                                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <p className="text-sm text-neutral-700">
                                                <span className="font-medium">Note:</span> {card.note}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-3 border-t border-green-200 center">
                                    <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}

                    {isFlipped && (
                        <div className="mt-6 animate-slide-up">
                            <p className="text-center text-sm text-neutral-600 mb-3">
                                How well did you know this? Use keys 1-4.
                            </p>

                            <div className="grid grid-cols-4 gap-3">
                                <button
                                    onClick={(event) => { event.stopPropagation(); onRate(1); setIsFlipped(false) }}
                                    className="flex flex-col items-center gap-2 p-4 border-2 border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    <span className="text-2xl">😰</span>
                                    <span className="text-sm font-medium text-red-900">Again</span>
                                </button>

                                <button
                                    onClick={(event) => { event.stopPropagation(); onRate(2); setIsFlipped(false) }}
                                    className="flex flex-col items-center gap-2 p-4 border-2 border-orange-200 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                                >
                                    <span className="text-2xl">😓</span>
                                    <span className="text-sm font-medium text-orange-900">Hard</span>
                                </button>

                                <button
                                    onClick={(event) => { event.stopPropagation(); onRate(3); setIsFlipped(false) }}
                                    className="flex flex-col items-center gap-2 p-4 border-2 border-yellow-200 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                                >
                                    <span className="text-2xl">🤔</span>
                                    <span className="text-sm font-medium text-yellow-900">Good</span>
                                </button>

                                <button
                                    onClick={(event) => { event.stopPropagation(); onRate(4); setIsFlipped(false) }}
                                    className="flex flex-col items-center gap-2 p-4 border-2 border-green-200 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                >
                                    <span className="text-2xl">😎</span>
                                    <span className="text-sm font-medium text-green-900">Easy</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {!isFlipped && (
                        <p className="text-center text-sm text-neutral-500 mt-4">
                            💡 Click the card or press Space to see the answer
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
