import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { classAPI, deckAPI } from "../../services/api";
import type { Class, Deck } from "../../types";

export default function BrowseSelection() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [decksByClass, setDecksByClass] = useState<Record<number, Deck[]>>({});
    const [loading, setLoading] = useState(true);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

    useEffect(() => {
        const fetchClassesAndDecks = async () => {
            try {
                setLoading(true);
                const fetchedClasses = await classAPI.getAllClasses();
                setClasses(fetchedClasses);

                // Fetch decks for all classes
                const decksData: Record<number, Deck[]> = {};
                for (const cls of fetchedClasses) {
                    const classDecks = await deckAPI.getClassDecks(cls.id);
                    decksData[cls.id] = classDecks;
                }
                setDecksByClass(decksData);

            } catch (error) {
                console.error("Failed to fetch classes and decks", error);
            } finally {
                setLoading(false);
            }
        };

        fetchClassesAndDecks();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 center">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col">
            <div className="container-custom py-8 w-full flex flex-col gap-8">
                {/* Header Outline */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                            Browse Cards
                        </h1>
                        <p className="text-neutral-600">
                            Select a deck to view all of its cards at once.
                        </p>
                    </div>
                    <div className="flex-shrink-0 bg-primary-50 p-4 rounded-full">
                        <svg className="w-12 h-12 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                </div>

                {/* Main Layout Grid - Dashboard Style */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    {/* Left/Top Panel: Course Filter */}
                    <div className="w-full shrink-0 lg:col-span-1 lg:sticky lg:top-24">
                        <h4 className="text-sm font-bold text-neutral-800 uppercase tracking-wider mb-4 border-b border-neutral-200 pb-2">
                            Filter by Course
                        </h4>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => setSelectedClassId(null)}
                                className={`w-full text-left px-4 py-2.5 rounded-xl transition-all flex items-center gap-3 border ${
                                    selectedClassId === null
                                        ? 'bg-primary-50 border-primary-200 shadow-sm'
                                        : 'bg-white border-transparent hover:border-neutral-200 hover:bg-neutral-50'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    selectedClassId === null ? 'bg-primary-100 text-primary-600' : 'bg-neutral-100 text-neutral-500'
                                }`}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                </div>
                                <span className={`font-medium ${selectedClassId === null ? 'text-primary-800' : 'text-neutral-700'}`}>All Courses</span>
                            </button>
                            {classes.map((cls) => (
                                <button
                                    key={cls.id}
                                    onClick={() => setSelectedClassId(cls.id)}
                                    className={`w-full text-left px-4 py-2.5 rounded-xl transition-all flex items-center gap-3 border ${
                                        selectedClassId === cls.id
                                            ? 'bg-primary-50 border-primary-200 shadow-sm'
                                            : 'bg-white border-transparent hover:border-neutral-200 hover:bg-neutral-50'
                                    }`}
                                >
                                    <div 
                                        className="w-8 h-8 rounded-lg shrink-0 opacity-80" 
                                        style={{ backgroundColor: cls.color === 'blue' ? '#3b82f6' : cls.color === 'green' ? '#22c55e' : cls.color === 'red' ? '#ef4444' : cls.color === 'purple' ? '#a855f7' : cls.color === 'orange' ? '#f97316' : cls.color === 'teal' ? '#14b8a6' : cls.color }}
                                    ></div>
                                    <span className={`font-medium truncate ${selectedClassId === cls.id ? 'text-primary-800' : 'text-neutral-700'}`}>{cls.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel: Decks Grid */}
                    <div className="flex-1 w-full lg:col-span-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {classes
                            .filter(cls => selectedClassId === null || cls.id === selectedClassId)
                            .flatMap(cls => {
                                const decks = decksByClass[cls.id] || [];
                                return decks.map(deck => (
                                    <Link
                                        key={deck.id}
                                        to={`/browse/${deck.id}`}
                                        className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-neutral-200 p-8 flex flex-col h-full group"
                                    >
                                        <div className="flex-1">
                                            <div className="text-sm font-semibold text-neutral-500 mb-3 flex items-center gap-2 uppercase tracking-wide">
                                                <span 
                                                    className="w-3 h-3 rounded-full" 
                                                    style={{ backgroundColor: cls.color === 'blue' ? '#3b82f6' : cls.color === 'green' ? '#22c55e' : cls.color === 'red' ? '#ef4444' : cls.color === 'purple' ? '#a855f7' : cls.color === 'orange' ? '#f97316' : cls.color === 'teal' ? '#14b8a6' : cls.color }}
                                                ></span>
                                                {cls.name}
                                            </div>
                                            <h3 className="font-bold text-neutral-900 group-hover:text-primary-600 transition-colors mb-4 text-2xl leading-tight">
                                                {deck.title}
                                            </h3>
                                            {deck.description && (
                                                <p className="text-neutral-600 line-clamp-3 text-base">
                                                    {deck.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-8 pt-5 border-t border-neutral-100 flex items-center justify-between">
                                            <span className="bg-neutral-100 text-neutral-700 px-3 py-1 rounded-md text-sm font-medium">
                                                {deck.cardCount} cards
                                            </span>
                                            <span className="text-primary-600 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                                                Browse Deck
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                </svg>
                                            </span>
                                        </div>
                                    </Link>
                                ));
                            })}
                        </div>

                    {classes.filter(cls => selectedClassId === null || cls.id === selectedClassId).flatMap(cls => decksByClass[cls.id] || []).length === 0 && (
                        <div className="text-center py-16 bg-white rounded-xl border border-neutral-200 border-dashed">
                            <h3 className="text-lg font-medium text-neutral-900 mb-2">No decks found</h3>
                            <p className="text-neutral-500">There are no flashcard decks available in the selected course.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </div>
    );
}