import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { deckAPI, flashcardAPI } from "../../services/api";
import { MarkdownEditor } from "../../components";
import MarkdownViewer from "../../components/MarkdownViewer";
import type { Deck } from "../../types";

export default function DeckExport() {
    const { deckId } = useParams<{ deckId: string }>();
    const [deck, setDeck] = useState<Deck | null>(null);
    const [markdownContent, setMarkdownContent] = useState("");
    const [loading, setLoading] = useState(true);
    
    const printRef = useRef<HTMLDivElement>(null);
    
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: deck?.title ? `${deck.title} - Flashcards` : "Flashcards",
        pageStyle: `
            @page {
                size: A4;
                margin: 20mm;
            }
            body {
                background-color: white;
            }
        `,
    });

    useEffect(() => {
        const fetchDeckData = async () => {
            try {
                setLoading(true);
                const fetchedDeck = await deckAPI.getDeck(Number(deckId));
                setDeck(fetchedDeck);
                
                const fetchedCards = await flashcardAPI.getDeckCards(Number(deckId), true);
                
                let initialMarkdown = `# ${fetchedDeck.title}\n\n`;
                if (fetchedDeck.description) {
                    initialMarkdown += `${fetchedDeck.description}\n\n`;
                }
                
                fetchedCards.forEach((card) => {
                    initialMarkdown += `\n---\n`;
                    initialMarkdown += `**Q:** ${card.front}\n\n`;
                    initialMarkdown += `**A:** ${card.back}\n\n`;
                    if (card.note) {
                        initialMarkdown += `*Note:* ${card.note}\n\n`;
                    }
                });
                
                setMarkdownContent(initialMarkdown);
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

    const previewChunks = markdownContent.split(/\n---\n/);
    const headerChunk = previewChunks[0];
    const cardChunks = previewChunks.slice(1);

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-neutral-200 shrink-0">
                <div className="container-custom py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            to={`/study/${deck.id}`}
                            className="text-neutral-600 hover:text-neutral-900"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div>
                            <h3 className="font-bold text-neutral-900">Export: {deck.title}</h3>
                            <p className="text-sm text-neutral-600">Edit markdown to customize PDF</p>
                        </div>
                    </div>
                    <div>
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                handlePrint();
                            }}
                            className="btn-primary flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Editor */}
                <div className="w-1/2 flex flex-col border-r border-neutral-200 bg-white">
                    <div className="flex-1 overflow-y-auto p-4">
                        <MarkdownEditor 
                            value={markdownContent} 
                            onChange={setMarkdownContent} 
                        />
                    </div>
                </div>

                {/* Right Panel: Preview */}
                <div className="w-1/2 bg-neutral-100 overflow-y-auto p-8 flex justify-center">
                    <div 
                        className="bg-white shadow-lg w-full max-w-[210mm] min-h-[297mm] p-8"
                        ref={printRef}
                    >
                        <div className="mb-8">
                            <MarkdownViewer content={headerChunk} enableImageResize={true} />
                        </div>
                        
                        <div className="flex flex-col">
                            {cardChunks.map((chunk, idx) => (
                                <div 
                                    key={idx} 
                                    className="break-inside-avoid py-6 border-b border-neutral-200 last:border-b-0"
                                    style={{ pageBreakInside: 'avoid' }}
                                >
                                    <MarkdownViewer content={chunk} enableImageResize={true} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
