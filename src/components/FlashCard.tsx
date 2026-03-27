import { useEffect, useRef, useState } from 'react'
import { ResizableBox } from 'react-resizable'
import type { FlashCard as FlashCardType } from '../types'
import MarkdownViewer from './MarkdownViewer'

interface FlashCardProps {
    card: FlashCardType
    onRate: (ease: 1 | 2 | 3 | 4) => void
}

export default function FlashCard({ card, onRate }: FlashCardProps) {
    const [isFlipped, setIsFlipped] = useState(false)
    const [cardSize, setCardSize] = useState({ width: 1000, height: 500 })
    const frontContentAreaRef = useRef<HTMLDivElement | null>(null)
    const backContentAreaRef = useRef<HTMLDivElement | null>(null)
    const frontContentInnerRef = useRef<HTMLDivElement | null>(null)
    const backContentInnerRef = useRef<HTMLDivElement | null>(null)

    const queueLabel =
        card.queue === 'NEW' ? 'New' : card.queue === 'LEARNING' ? 'Learning' : 'Review'
    const queueColor =
        card.queue === 'NEW' ? 'bg-blue-500' : card.queue === 'LEARNING' ? 'bg-orange-500' : 'bg-emerald-500'

    useEffect(() => {
        setIsFlipped(false)
    }, [card.id])

    useEffect(() => {
        setCardSize((current) => ({
            width: Math.max(current.width, 1000),
            height: Math.max(current.height, 500),
        }))
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

    useEffect(() => {
        const contentArea = isFlipped ? backContentAreaRef.current : frontContentAreaRef.current
        const contentInner = isFlipped ? backContentInnerRef.current : frontContentInnerRef.current

        if (!contentArea || !contentInner) {
            return
        }

        const updateCardSizeToFitContent = () => {
            const overflowWidth = Math.max(0, contentInner.scrollWidth - contentArea.clientWidth)
            const overflowHeight = Math.max(0, contentInner.scrollHeight - contentArea.clientHeight)
            const footerReserveHeight = 88

            if (overflowWidth === 0 && overflowHeight === 0) {
                return
            }

            setCardSize((current) => ({
                width: Math.max(1000, current.width + overflowWidth),
                height: Math.max(500, current.height + overflowHeight + footerReserveHeight),
            }))
        }

        const animationFrameId = window.requestAnimationFrame(updateCardSizeToFitContent)
        const delayedMeasurementId = window.setTimeout(updateCardSizeToFitContent, 200)
        const resizeObserver = new ResizeObserver(() => {
            updateCardSizeToFitContent()
        })

        resizeObserver.observe(contentInner)
        window.addEventListener('resize', updateCardSizeToFitContent)

        return () => {
            window.cancelAnimationFrame(animationFrameId)
            window.clearTimeout(delayedMeasurementId)
            resizeObserver.disconnect()
            window.removeEventListener('resize', updateCardSizeToFitContent)
        }
    }, [card.back, card.front, card.note, card.id, isFlipped])

    return (
        <div className={`w-full px-4 ${isFlipped ? 'pb-48' : ''}`}>
            <div className="mx-auto flex w-full justify-center">
                <div className="w-fit max-w-none">
                    <ResizableBox
                        width={cardSize.width}
                        height={cardSize.height}
                        minConstraints={[1000, 500]}
                        maxConstraints={[1800, 2200]}
                        resizeHandles={['se']}
                        onResizeStop={(_event, data) => {
                            setCardSize({
                                width: data.size.width,
                                height: data.size.height,
                            })
                        }}
                    >
                        <div className="h-full w-full">
                            {!isFlipped ? (
                                <div className="card h-full bg-gradient-to-br from-primary-50 to-white border-2 border-primary-200 transition-all duration-300">
                                    <div className="card-body flex h-full flex-col">
                                        <div className="flex items-center justify-between gap-4 border-b border-primary-200 pb-3">
                                            <span className="text-sm font-medium text-primary-600">Question</span>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-2 h-2 rounded-full ${queueColor}`}></div>
                                                    <span className="text-xs font-medium text-neutral-500">{queueLabel}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div ref={frontContentAreaRef} className="flex flex-1 justify-center overflow-hidden py-4">
                                            <div ref={frontContentInnerRef} className="w-fit max-w-none">
                                                <MarkdownViewer content={card.front} enableImageResize />
                                            </div>
                                        </div>

                                        <div className="center border-t border-primary-200 pt-3">
                                            <button
                                                type="button"
                                                className="btn-primary"
                                                onClick={() => setIsFlipped(true)}
                                            >
                                                Show Answer
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="card h-full bg-gradient-to-br from-green-50 to-white border-2 border-green-200 transition-all duration-300">
                                    <div className="card-body flex h-full flex-col">
                                        <div className="flex items-center justify-between gap-4 border-b border-green-200 pb-3">
                                            <span className="text-sm font-medium text-green-600">Answer</span>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-2 h-2 rounded-full ${queueColor}`}></div>
                                                    <span className="text-xs font-medium text-neutral-500">{queueLabel}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div ref={backContentAreaRef} className="flex flex-1 justify-center overflow-hidden py-4">
                                            <div ref={backContentInnerRef} className="w-fit max-w-none">
                                                <MarkdownViewer content={card.back} enableImageResize />

                                                {card.note && (
                                                    <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                                                        <p className="text-sm text-neutral-700">
                                                            <span className="font-medium">Note:</span> {card.note}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="center border-t border-green-200 pt-3">
                                            <button
                                                type="button"
                                                className="btn-ghost"
                                                onClick={() => setIsFlipped(false)}
                                            >
                                                Hide Answer
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ResizableBox>

                    {isFlipped && (
                        <div className="animate-slide-up fixed inset-x-0 bottom-6 z-40 mx-auto w-[min(1100px,calc(100vw-2rem))] rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-xl backdrop-blur">
                            <p className="mb-3 text-center text-sm text-neutral-600">
                                How well did you know this? Use keys 1-4.
                            </p>

                            <div className="grid grid-cols-4 gap-3">
                                <button
                                    onClick={() => { onRate(1); setIsFlipped(false) }}
                                    className="flex flex-col items-center gap-2 rounded-lg border-2 border-red-200 bg-red-50 p-4 transition-colors hover:bg-red-100"
                                >
                                    <span className="text-2xl">😰</span>
                                    <span className="text-sm font-medium text-red-900">Again</span>
                                </button>

                                <button
                                    onClick={() => { onRate(2); setIsFlipped(false) }}
                                    className="flex flex-col items-center gap-2 rounded-lg border-2 border-orange-200 bg-orange-50 p-4 transition-colors hover:bg-orange-100"
                                >
                                    <span className="text-2xl">😓</span>
                                    <span className="text-sm font-medium text-orange-900">Hard</span>
                                </button>

                                <button
                                    onClick={() => { onRate(3); setIsFlipped(false) }}
                                    className="flex flex-col items-center gap-2 rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4 transition-colors hover:bg-yellow-100"
                                >
                                    <span className="text-2xl">🤔</span>
                                    <span className="text-sm font-medium text-yellow-900">Good</span>
                                </button>

                                <button
                                    onClick={() => { onRate(4); setIsFlipped(false) }}
                                    className="flex flex-col items-center gap-2 rounded-lg border-2 border-green-200 bg-green-50 p-4 transition-colors hover:bg-green-100"
                                >
                                    <span className="text-2xl">😎</span>
                                    <span className="text-sm font-medium text-green-900">Easy</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {!isFlipped && (
                        <p className="mt-4 text-center text-sm text-neutral-500">
                            💡 Press Space or use Show Answer
                        </p>
                    )}

                    {isFlipped && <div className="h-35" aria-hidden="true" />}
                </div>
            </div>
        </div>
    )
}
