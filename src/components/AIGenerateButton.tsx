import { useState } from "react";

interface AIGenerateButtonProps {
    onGenerate: (data: { question: string; answer: string; hint: string }) => void
}

export default function AIGenerateButton({ onGenerate }: AIGenerateButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [content, setContent] = useState('')

    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!content.trim()) {
            alert('Please enter a prompt');
            return;
        }

        setLoading(true);

        // Simulate API call to generate content based on prompt
        setTimeout(() => {
            const mockData = {
                question: `**What is the main concept?**\n\nBased on the content: "${content.substring(0, 50)}..."`,
                answer: `**Answer:**\n\nThe main concept is... (AI will generate based on your content)\n\n- Point 1\n- Point 2\n- Point 3`,
                hint: `Remember: Key concept from the content`
            }

            onGenerate(mockData)
            setShowModal(false)
            setContent('')
            setLoading(false)
        }, 2000)
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
                                    <p className="text-sm text-neutral-600">Paste your content and AI will create question, answer, and hint</p>
                                </div>
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
                                    💡 Paste any educational content - AI will generate a question, answer, and helpful hint
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
                                            Generate Flashcard
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