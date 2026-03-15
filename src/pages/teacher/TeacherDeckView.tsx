import type { FlashCard, Deck } from "../../types";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { aiAPI, deckAPI, flashcardAPI } from "../../services/api";
import { AIGenerateButton, MarkdownEditor, MarkdownViewer } from "../../components";

type AIGeneratedCardDraft = {
    id: number
    question: string
    answer: string
    hint: string
}

export default function TeacherDeckView() {
    const { deckId } = useParams<{ deckId: string }>();
    const [deck, setDeck] = useState<Deck | null>(null);
    const [cards, setCards] = useState<FlashCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateCardModal, setShowCreateCardModal] = useState(false);
    const [cardFormData, setCardFormData] = useState({
        front: "",
        back: "",
        note: "",
    });


    const [selectedCard, setSelectedCard] = useState<FlashCard | null>(null)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [editFormData, setEditFormData] = useState({
        front: '',
        back: '',
        note: ''
    })
    const [aiDraftCards, setAIDraftCards] = useState<AIGeneratedCardDraft[]>([])

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [deckData, cardsData] = await Promise.all([
                    deckAPI.getDeck(Number(deckId)),
                    flashcardAPI.getDeckCards(Number(deckId))
                ]);
                setDeck(deckData);
                setCards(cardsData);
            } catch (error) {
                console.error("Error fetching deck data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [deckId])

    const handleCreateCard = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!cardFormData.front.trim() || !cardFormData.back.trim()) {
            alert('Please fill in both Question and Answer fields')
            return
        }

        try {
            const newCard = await flashcardAPI.createCard(Number(deckId), cardFormData);
            setCards(prev => [...prev, newCard]);
            setShowCreateCardModal(false);
            setCardFormData({ front: "", back: "", note: "" });
        }
        catch (error) {
            console.error("Error creating card:", error);
            alert('Failed to create card. Please try again.')
        }
    }


    const handleDeleteCard = async () => {
        if (!selectedCard) return

        try {
            // await flashcardAPI.deleteCard(selectedCard.id)
            //TODO: implement deleteCard API

            setCards(cards.filter(c => c.id !== selectedCard.id))
            setShowDeleteConfirm(false)
            setSelectedCard(null)
        } catch (error) {
            console.error('Failed to delete card:', error)
            alert('Failed to delete card. Please try again.')
        }
    }


    const handleEditCard = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedCard) return

        try {
            // Update card via API
            await flashcardAPI.updateCard(selectedCard.id, editFormData)

            // Update local state
            setCards(cards.map(c =>
                c.id === selectedCard.id
                    ? { ...c, ...editFormData }
                    : c
            ))

            setShowEditModal(false)
            setSelectedCard(null)
            setEditFormData({ front: '', back: '', note: '' })
        } catch (error) {
            console.error('Failed to update card:', error)
            alert('Failed to update card. Please try again.')
        }
    }

    const handleGenerateAICards = async ({ text, count }: { text: string; count: number }) => {
        const generatedCards = await aiAPI.generateFlashcards({ text, count })
        setAIDraftCards(
            generatedCards.map((card, index) => ({
                id: Date.now() + index,
                question: card.question,
                answer: card.answer,
                hint: card.hint,
            }))
        )
    }

    const handleUpdateAIDraft = (draftId: number, field: keyof Omit<AIGeneratedCardDraft, 'id'>, value: string) => {
        setAIDraftCards((currentDrafts) =>
            currentDrafts.map((draft) => (draft.id === draftId ? { ...draft, [field]: value } : draft))
        )
    }

    const handleDiscardAIDraft = (draftId: number) => {
        setAIDraftCards((currentDrafts) => currentDrafts.filter((draft) => draft.id !== draftId))
    }

    const handleConfirmAIDraft = async (draftId: number) => {
        const draft = aiDraftCards.find((item) => item.id === draftId)

        if (!draft) {
            return
        }

        if (!draft.question.trim() || !draft.answer.trim()) {
            alert('Generated card needs both question and answer before confirming.')
            return
        }

        try {
            const createdCard = await flashcardAPI.createCard(Number(deckId), {
                front: draft.question,
                back: draft.answer,
                note: draft.hint,
            })
            setCards((currentCards) => [...currentCards, createdCard])
            setAIDraftCards((currentDrafts) => currentDrafts.filter((item) => item.id !== draftId))
        } catch (error) {
            console.error('Failed to confirm AI generated card:', error)
            alert('Failed to save generated card. Please try again.')
        }
    }

    const handleConfirmAllAIDrafts = async () => {
        for (const draft of aiDraftCards) {
            if (!draft.question.trim() || !draft.answer.trim()) {
                alert('Every generated card needs both question and answer before confirming all.')
                return
            }
        }

        try {
            const createdCards = await Promise.all(
                aiDraftCards.map((draft) =>
                    flashcardAPI.createCard(Number(deckId), {
                        front: draft.question,
                        back: draft.answer,
                        note: draft.hint,
                    })
                )
            )

            setCards((currentCards) => [...currentCards, ...createdCards])
            setAIDraftCards([])
        } catch (error) {
            console.error('Failed to confirm all AI generated cards:', error)
            alert('Failed to save generated cards. Please try again.')
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
                <Link to={`/teacher/class/${deck.classId}`} className="hover:text-primary-600">
                    {deck.className}
                </Link>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-neutral-900 font-medium">{deck.title}</span>
            </nav>

            {/* Deck Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="mb-2">{deck.title}</h1>
                    {deck.description && (
                        <p className="text-neutral-600 mb-3">{deck.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-neutral-600">
                        <span>{cards.length} flashcards</span>
                        <span>•</span>
                        <span>Created {new Date(deck.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                <button
                    onClick={() => setShowCreateCardModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Card
                </button>
            </div>

            {/* Cards List */}
            <div>
                <h2 className="mb-6">Flashcards</h2>

                {cards.length === 0 ? (
                    <div className="card">
                        <div className="card-body text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No flashcards yet</h3>
                            <p className="text-neutral-600 mb-6">Start adding flashcards to this deck</p>
                            <button
                                onClick={() => setShowCreateCardModal(true)}
                                className="btn-primary"
                            >
                                Add First Card
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cards.map((card, index) => (
                            <div key={card.id} className="card hover:shadow-lg transition-all">

                                <div className="card-body">

                                    <div className="flex items-start justify-between mb-3">
                                        <span className="text-xs font-medium text-neutral-500">Card #{index + 1}</span>

                                        {/* Dropdown Menu */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setSelectedCard(selectedCard?.id === card.id ? null : card)}
                                                className="text-neutral-400 hover:text-neutral-600"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                </svg>
                                            </button>


                                            {selectedCard?.id === card.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-10 animate-slide-down">
                                                    <button
                                                        onClick={() => {
                                                            setEditFormData({
                                                                front: card.front,
                                                                back: card.back,
                                                                note: card.note || ''
                                                            })
                                                            setShowEditModal(true)
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Edit Card
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            setShowDeleteConfirm(true)
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Delete Card
                                                    </button>
                                                </div>
                                            )}

                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-medium text-neutral-600 mb-1">Question:</p>
                                            <div className="text-neutral-900 prose prose-sm max-w-none break-words">
                                                <MarkdownViewer content={card.front} />
                                            </div>
                                        </div>

                                        <div className="border-t border-neutral-200 pt-3">
                                            <p className="text-xs font-medium text-neutral-600 mb-1">Answer:</p>
                                            <div className="text-neutral-900 prose prose-sm max-w-none break-words">
                                                <MarkdownViewer content={card.back} />
                                            </div>
                                        </div>

                                        {card.note && (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                <p className="text-xs font-medium text-yellow-900 mb-1">Note:</p>
                                                <p className="text-sm text-yellow-800 break-words">{card.note}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Card Modal */}
            {showCreateCardModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="card max-w-5xl w-full my-8 animate-scale-in max-h-[90vh] overflow-y-auto">
                        <div className="card-body">
                            <div className="flex items-center justify-between mb-6">
                                <h2>Add New Flashcard</h2>
                                <button
                                    onClick={() => setShowCreateCardModal(false)}
                                    className="text-neutral-400 hover:text-neutral-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleCreateCard}>

                                {/* AI Generate Button - at the top */}
                                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                                    <AIGenerateButton
                                        onGenerate={handleGenerateAICards}
                                    />
                                </div>

                                {aiDraftCards.length > 0 && (
                                    <div className="mb-8 rounded-lg border border-primary-200 bg-primary-50/50 p-4">
                                        <div className="mb-4 flex items-center justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-neutral-900">AI Generated Drafts</h3>
                                                <p className="text-sm text-neutral-600">
                                                    Review each generated card, edit as needed, then confirm or discard it.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleConfirmAllAIDrafts}
                                                className="btn-primary"
                                            >
                                                Confirm All
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {aiDraftCards.map((draft, index) => (
                                                <div key={draft.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <span className="text-sm font-semibold text-neutral-900">Generated Card #{index + 1}</span>
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDiscardAIDraft(draft.id)}
                                                                className="btn-ghost"
                                                            >
                                                                Discard
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleConfirmAIDraft(draft.id)}
                                                                className="btn-primary"
                                                            >
                                                                Confirm Card
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="form-group">
                                                            <label className="form-label font-bold">Question</label>
                                                            <MarkdownEditor
                                                                value={draft.question}
                                                                onChange={(value) => handleUpdateAIDraft(draft.id, 'question', value)}
                                                            />
                                                        </div>

                                                        <div className="form-group">
                                                            <label className="form-label font-bold">Answer</label>
                                                            <MarkdownEditor
                                                                value={draft.answer}
                                                                onChange={(value) => handleUpdateAIDraft(draft.id, 'answer', value)}
                                                            />
                                                        </div>

                                                        <div className="form-group">
                                                            <label className="form-label">Hint / Note</label>
                                                            <textarea
                                                                value={draft.hint}
                                                                onChange={(e) => handleUpdateAIDraft(draft.id, 'hint', e.target.value)}
                                                                className="form-input"
                                                                rows={3}
                                                                placeholder="Optional context from AI generation..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Question Field */}
                                <div className="form-group">
                                    <label className="form-label">Question (Front) *</label>
                                    <MarkdownEditor
                                        value={cardFormData.front}
                                        onChange={(value) => setCardFormData({ ...cardFormData, front: value })}
                                    />
                                </div>

                                {/* Answer Field */}
                                <div className="form-group">
                                    <label className="form-label">Answer (Back) *</label>
                                    <MarkdownEditor
                                        value={cardFormData.back}
                                        onChange={(value) => setCardFormData({ ...cardFormData, back: value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Note (Optional)</label>
                                    <textarea
                                        value={cardFormData.note}
                                        onChange={(e) => setCardFormData({ ...cardFormData, note: e.target.value })}
                                        className="form-input"
                                        placeholder="Add a helpful note or mnemonic..."
                                        rows={2}
                                    />
                                    <p className="form-help">This will be shown to students as a hint</p>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateCardModal(false)
                                            setAIDraftCards([])
                                        }}
                                        className="btn-ghost flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary flex-1">
                                        Add Card
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Delete Confirmation  Modal */}
            {
                showDeleteConfirm && selectedCard && (
                    <div className="fixed inset-0 bg-black/50 center z-50 p-4">
                        <div className="card max-w-md w-full animate-scale-in">
                            <div className="card-body">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-red-100 rounded-full center mx-auto mb-4">
                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>

                                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">Delete Card?</h3>
                                    <p className="text-neutral-600 mb-6">
                                        This action cannot be undone. The card will be permanently removed.
                                    </p>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setShowDeleteConfirm(false)
                                                setSelectedCard(null)
                                            }}
                                            className="btn-ghost flex-1"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDeleteCard}
                                            className="btn-error flex-1"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Card Modal */}
            {
                showEditModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                        <div className="card max-w-5xl w-full my-8 animate-scale-in max-h-[90vh] overflow-y-auto">
                            <div className="card-body">
                                <div className="flex items-center justify-between mb-6">
                                    <h2>Edit Flashcard</h2>
                                    <button
                                        onClick={() => {
                                            setShowEditModal(false)
                                            setSelectedCard(null)
                                        }}
                                        className="text-neutral-400 hover:text-neutral-600"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <form onSubmit={handleEditCard} className="space-y-4">
                                    <div className="form-group">
                                        <label className="form-label font-bold">Question (Front) *</label>
                                        <MarkdownEditor
                                            value={editFormData.front}
                                            onChange={(value) => setEditFormData({ ...editFormData, front: value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label font-bold">Answer (Back) *</label>
                                        <MarkdownEditor
                                            value={editFormData.back}
                                            onChange={(value) => setEditFormData({ ...editFormData, back: value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Note (Optional)</label>
                                        <textarea
                                            value={editFormData.note}
                                            onChange={(e) => setEditFormData({ ...editFormData, note: e.target.value })}
                                            className="form-input"
                                            placeholder="Add a helpful note or mnemonic..."
                                            rows={2}
                                        />
                                    </div>

                                    <div className="flex gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowEditModal(false)
                                                setSelectedCard(null)
                                            }}
                                            className="btn-ghost flex-1"
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn-primary flex-1">
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
