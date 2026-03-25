import type { Deck } from "../types";
import { Link } from "react-router-dom";

interface DeckCardProps {
    deck: Deck
}

export default function DeckCard({ deck }: DeckCardProps) {
    // const progress = deck.cardCount > 0 ? (deck.studiedCount / deck.cardCount) * 100 : 0


    return (
        <Link
            to={`/study/${deck.id}`}
            className="block group"
        >
            <div className="card hover:shadow-lg transition-all duration-300">
                <div className="card-body">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg text-neutral-900 group-hover:text-primary-600 transition-colors">
                                {deck.title}
                            </h3>
                            {deck.description && (
                                <p className="text-sm text-neutral-600 mt-1 truncate-2">
                                    {deck.description}
                                </p>
                            )}
                        </div>

                        {deck.dueCount > 0 && (
                            <span className="badge badge-error ml-2">
                                {deck.dueCount} due
                            </span>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {/* <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
                            <span>Progress</span>
                            <span>{deck.studiedCount} / {deck.cardCount} cards</span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-2">
                            <div
                                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div> */}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-neutral-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                            <span>{deck.cardCount} cards</span>
                        </div>

                        <span className="text-primary-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                            Study now
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    )

}