import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { classAPI, deckAPI } from '../../services/api'
import type { Class, Deck } from '../../types'
import { TeacherDeckCard } from '../../components'

export default function TeacherClassView() {
    const { classId } = useParams<{ classId: string }>()
    const [classData, setClassData] = useState<Class | null>(null)
    const [decks, setDecks] = useState<Deck[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateDeckModal, setShowCreateDeckModal] = useState(false)
    const [deckFormData, setDeckFormData] = useState({ title: '', description: '' })

    useEffect(() => {
        const fetchClassData = async () => {
            try {
                setLoading(true)
                const [classResponse, decksResponse] = await Promise.all([
                    classAPI.getClass(Number(classId)),
                    deckAPI.getClassDecks(Number(classId))
                ])
                setClassData(classResponse)
                setDecks(decksResponse)
            }
            catch (error) {
                console.error('Error fetching class data:', error)
            }
            finally {
                setLoading(false)
            }
        }
        fetchClassData()
    }, [classId])

    const handleCreateDeck = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const newDeck = await deckAPI.createDeck(Number(classId), deckFormData)
            setDecks([...decks, newDeck])
            setShowCreateDeckModal(false)
            setDeckFormData({ title: '', description: '' })
        }
        catch (error) {
            console.error('Error creating deck:', error)
            alert('Failed to create deck. Please try again.')

        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 center">
                <div className="spinner"></div>
            </div>
        )
    }

    if (!classData) {
        return (
            <div className="min-h-screen bg-neutral-50 center">
                <div className="text-center">
                    <h2>Class not found</h2>
                    <Link to="/teacher/dashboard" className="link">Back to dashboard</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="container-custom py-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-neutral-600 mb-6">
                <Link to="/teacher/dashboard" className="hover:text-primary-600">
                    My Classes
                </Link>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-neutral-900 font-medium">{classData.name}</span>
            </nav>

            {/* Class Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1>{classData.name}</h1>
                        <span className="badge badge-primary">{classData.subject}</span>
                    </div>
                    {classData.description && (
                        <p className="text-neutral-600 mb-3">{classData.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-neutral-600">
                        <span>Code: <span className="font-mono font-bold">{classData.classCode}</span></span>
                        <span>{classData.studentCount} students</span>
                    </div>
                </div>

                <button
                    onClick={() => setShowCreateDeckModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Deck
                </button>
            </div>

            {/* Decks List */}
            <div>
                <h2 className="mb-6">Study Decks ({decks.length})</h2>

                {decks.length === 0 ? (
                    <div className="card">
                        <div className="card-body text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No decks yet</h3>
                            <p className="text-neutral-600 mb-6">Create your first deck to add flashcards</p>
                            <button
                                onClick={() => setShowCreateDeckModal(true)}
                                className="btn-primary"
                            >
                                Create Deck
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {decks.map(deck => (
                            <TeacherDeckCard key={deck.id} deck={deck} />
                        ))}
                    </div>
                )}
            </div>

            {/* Create Deck Modal */}
            {showCreateDeckModal && (
                <div className="fixed inset-0 bg-black/50 center z-50 p-4">
                    <div className="card max-w-lg w-full animate-scale-in">
                        <div className="card-body">
                            <div className="flex items-center justify-between mb-6">
                                <h2>Create New Deck</h2>
                                <button
                                    onClick={() => setShowCreateDeckModal(false)}
                                    className="text-neutral-400 hover:text-neutral-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleCreateDeck} className="space-y-4">
                                <div className="form-group">
                                    <label className="form-label">Deck Title *</label>
                                    <input
                                        type="text"
                                        value={deckFormData.title}
                                        onChange={(e) => setDeckFormData({ ...deckFormData, title: e.target.value })}
                                        className="form-input"
                                        placeholder="e.g., Chapter 1: Introduction"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        value={deckFormData.description}
                                        onChange={(e) => setDeckFormData({ ...deckFormData, description: e.target.value })}
                                        className="form-input"
                                        placeholder="Brief description of this deck..."
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateDeckModal(false)}
                                        className="btn-ghost flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary flex-1">
                                        Create Deck
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

}