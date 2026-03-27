import { useState } from 'react'
import type { FlashCard as FlashCardType } from '../types'
import MarkdownViewer from './MarkdownViewer'
import { useRef } from 'react'

// import { ResizableBox } from 'react-resizable'
// import 'react-resizable/css/styles.css'

interface FlashCardProps {
    card: FlashCardType
    onRate: (ease: 1 | 2 | 3 | 4) => void
}

export default function FlashCard({ card, onRate }: FlashCardProps) {
    const [isFlipped, setIsFlipped] = useState(false)
    const [cardSize, setCardSize] = useState({ width: 800, height: 500 })
    const [isResizing, setIsResizing] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)

    const handleResizeStart = (e: React.MouseEvent, direction: string) => {
        e.preventDefault()
        e.stopPropagation()
        setIsResizing(true)

        const startX = e.clientX
        const startY = e.clientY
        const startWidth = cardSize.width
        const startHeight = cardSize.height

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX
            const deltaY = moveEvent.clientY - startY

            setCardSize((prev) => {
                let newWidth = prev.width
                let newHeight = prev.height

                // Height resize
                if (direction.includes('height') || direction.includes('both')) {
                    newHeight = Math.max(300, startHeight + deltaY)
                }

                // Width resize - double the delta for symmetric expansion
                if (direction.includes('width') || direction.includes('both')) {
                    if (direction.includes('left')) {
                        newWidth = Math.max(400, Math.min(1200, startWidth - deltaX * 2))
                    } else if (direction.includes('right')) {
                        newWidth = Math.max(400, Math.min(1200, startWidth + deltaX * 2))
                    }
                }

                return { width: newWidth, height: newHeight }
            })
        }

        const handleMouseUp = () => {
            setIsResizing(false)
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }


    return (
        <div className="w-full flex justify-center px-4">
            {/* Card Container - Centered with resize handles */}
            <div
                ref={cardRef}
                className="relative"
                style={{ width: `${cardSize.width}px`, height: `${cardSize.height}px` }}
            >
                {/* Main Card */}
                <div
                    className="relative h-full cursor-pointer perspective-1000"
                    onClick={() => !isResizing && setIsFlipped(!isFlipped)}
                    style={{ pointerEvents: isResizing ? 'none' : 'auto' }}
                >
                    <div
                        className="relative h-full cursor-pointer perspective-1000"
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
                                        {/* Header */}
                                        <div className="flex items-center justify-between pb-3 border-b border-primary-200">
                                            <span className="text-sm font-medium text-primary-600">Question</span>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-2 h-2 rounded-full ${
                                                        card.queue === 'NEW' ? 'bg-blue-500' :
                                                        card.queue === 'LEARNING' ? 'bg-orange-500' :
                                                        'bg-emerald-500'
                                                    }`}></div>
                                                    <span className="text-xs font-medium text-neutral-500">
                                                        {card.queue === 'NEW' ? 'New' : card.queue === 'LEARNING' ? 'Learning' : 'Review'}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-neutral-400">|</span>
                                                <span className="text-xs text-neutral-400">Click to reveal</span>
                                            </div>
                                        </div>

                                        {/* Content - Scrollable */}
                                        <div className="flex-1 overflow-y-auto py-4">
                                            <MarkdownViewer content={card.front} />
                                        </div>

                                        {/* Footer */}
                                        <div className="pt-3 border-t border-primary-200 center">
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
                                        {/* Header */}
                                        <div className="flex items-center justify-between pb-3 border-b border-green-200">
                                            <span className="text-sm font-medium text-green-600">Answer</span>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-2 h-2 rounded-full ${
                                                        card.queue === 'NEW' ? 'bg-blue-500' :
                                                        card.queue === 'LEARNING' ? 'bg-orange-500' :
                                                        'bg-emerald-500'
                                                    }`}></div>
                                                    <span className="text-xs font-medium text-neutral-500">
                                                        {card.queue === 'NEW' ? 'New' : card.queue === 'LEARNING' ? 'Learning' : 'Review'}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-neutral-400">|</span>
                                                <span className="text-xs text-neutral-400">Click to flip back</span>
                                            </div>
                                        </div>

                                        {/* Content - Scrollable */}
                                        <div className="flex-1 overflow-y-auto py-4">
                                            <MarkdownViewer content={card.back} />

                                            {/* Note below answer */}
                                            {card.note && (
                                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                    <p className="text-sm text-neutral-700">
                                                        <span className="font-medium">Note:</span> {card.note}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="pt-3 border-t border-green-200 center">
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

                            <div className="grid grid-cols-4 gap-3">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRate(1); setIsFlipped(false) }}
                                    className="flex flex-col items-center gap-2 p-4 border-2 border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    <span className="text-2xl">😰</span>
                                    <span className="text-sm font-medium text-red-900">Again</span>
                                </button>

                                <button
                                    onClick={(e) => { e.stopPropagation(); onRate(2); setIsFlipped(false) }}
                                    className="flex flex-col items-center gap-2 p-4 border-2 border-orange-200 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                                >
                                    <span className="text-2xl">😓</span>
                                    <span className="text-sm font-medium text-orange-900">Hard</span>
                                </button>

                                <button
                                    onClick={(e) => { e.stopPropagation(); onRate(3); setIsFlipped(false) }}
                                    className="flex flex-col items-center gap-2 p-4 border-2 border-yellow-200 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                                >
                                    <span className="text-2xl">🤔</span>
                                    <span className="text-sm font-medium text-yellow-900">Good</span>
                                </button>

                                <button
                                    onClick={(e) => { e.stopPropagation(); onRate(4); setIsFlipped(false) }}
                                    className="flex flex-col items-center gap-2 p-4 border-2 border-green-200 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                >
                                    <span className="text-2xl">😎</span>
                                    <span className="text-sm font-medium text-green-900">Easy</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Hint */}
                    {
                        !isFlipped && (
                            <p className="text-center text-sm text-neutral-500 mt-4">
                                💡 Click the card to see the answer
                            </p>
                        )
                    }
                </div >
                {/* Resize Handles */}
                {/* Bottom Handle - Height only */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-primary-300 transition-colors"
                    onMouseDown={(e) => handleResizeStart(e, 'height')}
                />

                {/* Left Handle - Width (expands both sides) */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary-300 transition-colors"
                    onMouseDown={(e) => handleResizeStart(e, 'width-left')}
                />

                {/* Right Handle - Width (expands both sides) */}
                <div
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary-300 transition-colors"
                    onMouseDown={(e) => handleResizeStart(e, 'width-right')}
                />

                {/* Bottom-Left Corner - Both */}
                <div
                    className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize hover:bg-primary-400 transition-colors"
                    onMouseDown={(e) => handleResizeStart(e, 'both-left')}
                />

                {/* Bottom-Right Corner - Both */}
                <div
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize hover:bg-primary-400 transition-colors"
                    onMouseDown={(e) => handleResizeStart(e, 'both-right')}
                />

            </div>


        </div>
    )
}