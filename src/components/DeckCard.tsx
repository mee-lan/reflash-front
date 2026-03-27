import type { Deck } from "../types";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import RelativeTime from "./RelativeTime";

interface DeckCardProps {
    deck: Deck
}

export default function DeckCard({ deck }: DeckCardProps) {
    const navigate = useNavigate();

    // Pull the stats specific to this deck from Redux
    const deckStats = useSelector((state: RootState) => state.progress.byDeck[deck.id]);

    // If Redux hasn't loaded the stats yet, we fallback to 0 or the default deck prop values
    const dueToday = deckStats?.dueToday || deck.dueCount || 0;
    const newCards = deckStats?.newCards || 0;
    const learningCards = deckStats?.learningCards || 0;
    const totalCards = deckStats?.totalCards || deck.cardCount || 0;

    return (
        <div
            onClick={() => navigate(`/study/${deck.id}`)}
            className="block group cursor-pointer h-full"
        >
            <div className="card hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                <div className="card-body flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg text-neutral-900 group-hover:text-primary-600 transition-colors">
                                {deck.title}
                            </h3>
                            {deck.description && (
                                <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                                    {deck.description}
                                </p>
                            )}
                        </div>

                        {/* Status Badge & Actions */}
                        <div className="flex items-center gap-2 ml-2 shrink-0">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigate(`/export/${deck.id}`);
                                }}
                                className="p-1.5 bg-primary-50 text-primary-600 hover:bg-primary-100 hover:text-primary-700 rounded-md border border-primary-200 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                                title="Export to PDF"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </button>
                            
                            {(dueToday + newCards) > 0 ? (
                                <span className="badge badge-error">
                                    {dueToday + newCards} due
                                </span>
                            ) : deckStats?.nextDue ? (
                                <span className="badge bg-neutral-100 text-neutral-600 border-neutral-200 font-medium text-xs px-2 py-1 rounded-full">
                                    Next: <RelativeTime timestampSeconds={deckStats.nextDue} />
                                </span>
                            ) : (
                                <span className="badge bg-emerald-50 text-emerald-600 border-emerald-200 font-medium text-xs px-2 py-1 rounded-full border">
                                    ✓ Done
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mt-auto pt-4">
                        {/* Spaced Repetition Stats Breakdown */}
                        {deckStats && (
                            <div className="flex items-center gap-2 mb-4 text-xs font-medium">
                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                                    New: {newCards}
                                </span>
                                <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded-md">
                                    Learn: {learningCards}
                                </span>
                                <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md">
                                    Review Due: {dueToday}
                                </span>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between text-sm pt-3 border-t border-neutral-100">
                            <div className="flex items-center gap-1 text-neutral-500 font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                                <span>{totalCards} total cards</span>
                            </div>

                            <span className="text-primary-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                                Study now
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
