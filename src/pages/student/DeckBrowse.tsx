import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { deckAPI, flashcardAPI } from "../../services/api";
import MarkdownViewer from "../../components/MarkdownViewer";
import type { Deck, FlashCard } from "../../types";

export default function DeckBrowse() {
    const { deckId } = useParams<{ deckId: string }>();
    const [deck, setDeck] = useState<Deck | null>(null);
    const [cards, setCards] = useState<FlashCard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDeckData = async () => {
            try {
                setLoading(true);
                const fetchedDeck = await deckAPI.getDeck(Number(deckId));
                setDeck(fetchedDeck);
                
                const fetchedCards = await flashcardAPI.getDeckCards(Number(deckId), true);
                setCards(fetchedCards);
            } catch (error) {
                console.error("Failed to fetch deck data", error);
            } finally {
                setLoading(false);
            }
        };

        if (deckId) {
            fetchDeckData();
        }
    }, [deckId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!deck) {
        return (
            <div className="min-h-screen bg-neutral-50 center">
                <div className="text-center">
                    <h2>Deck not found</h2>
                    <Link to="/dashboard" className="link">Back to dashboard</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
                <div className="container-custom py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            to={`/dashboard`}
                            className="text-neutral-600 hover:text-neutral-900"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div>
                            <h3 className="font-bold text-neutral-900">Browse: {deck.title}</h3>
                            <p className="text-sm text-neutral-600">{cards.length} cards</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container-custom py-8">
                <div className="max-w-3xl mx-auto flex flex-col gap-6">
                    {cards.map((card, idx) => (
                        <div key={card.id || idx} className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                            <div className="p-6">
                                <div className="mb-4 pb-4 border-b border-neutral-100">
                                    <h4 className="text-sm font-semibold text-neutral-500 mb-2 uppercase tracking-wider">Front</h4>
                                    <MarkdownViewer content={card.front} enableImageResize />
                                </div>
                                <div className="mb-4 pb-4 border-b border-neutral-100">
                                    <h4 className="text-sm font-semibold text-neutral-500 mb-2 uppercase tracking-wider">Back</h4>
                                    <MarkdownViewer content={card.back} enableImageResize />
                                </div>
                                {card.note && (
                                    <div className="mb-4">
                                        <h4 className="text-sm font-semibold text-neutral-500 mb-2 uppercase tracking-wider">Note</h4>
                                        <MarkdownViewer content={card.note} enableImageResize />
                                    </div>
                                )}
                            </div>
                            <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-200 flex flex-wrap gap-4 text-xs text-neutral-500">
                                {card.crtFormatted && (
                                    <div className="flex items-center gap-1">
                                        <span className="font-medium">Created:</span> {card.crtFormatted}
                                    </div>
                                )}
                                {card.dueFormatted && (
                                    <div className="flex items-center gap-1">
                                        <span className="font-medium">Due:</span> {card.dueFormatted === "0" ? "Not scheduled yet (New)" : card.dueFormatted}
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <span className="font-medium">Type:</span> {card.type}
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="font-medium">Queue:</span> {card.queue}
                                </div>
                            </div>
                        </div>
                    ))}
                    {cards.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-xl border border-neutral-200">
                            <h3 className="text-lg font-medium text-neutral-900 mb-2">No cards found</h3>
                            <p className="text-neutral-500">This deck doesn't have any cards yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}