import { useState } from "react";

interface AIGenerateButtonProps {
    onGenerate: (payload: { text: string; count: number }) => Promise<void> | void
}

export default function AIGenerateButton({ onGenerate }: AIGenerateButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [content, setContent] = useState('')
    const [count, setCount] = useState(5)

    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!content.trim()) {
            alert('Please enter a prompt');
            return;
        }

        setLoading(true);

        try {
            await onGenerate({ text: content, count })
            setShowModal(false)
            setContent('')
            setCount(5)
        } catch (error) {
            console.error('Failed to generate flashcards:', error)
            alert('Failed to generate flashcards. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate with AI
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="card max-w-3xl w-full animate-scale-in">
                        <div className="card-body">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Generate Flashcard with AI</h3>
                                    <p className="text-sm text-neutral-600">Paste your content and AI will create editable draft flashcards</p>
                                </div>
                            </div>

                            <div className="form-group mb-4">
                                <label className="form-label">Number of Cards</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={count}
                                    onChange={(e) => setCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                                    className="form-input"
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Your Content</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="form-input font-mono text-sm"
                                    placeholder="Paste a paragraph, definition, or concept here...

Example:
Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar."
                                    rows={8}
                                    disabled={loading}
                                />
                                <p className="form-help">
                                    Paste any educational content. The generated cards will appear in the add-card modal for review and editing.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="btn-ghost flex-1"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <div className="spinner w-4 h-4 border-white"></div>
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Generate Draft Cards
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
