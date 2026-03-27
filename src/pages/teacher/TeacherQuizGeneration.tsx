import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { classAPI, flashcardAPI } from '../../services/api';
import type { Class, Deck, FlashCard } from '../../types';

export default function TeacherQuizGeneration() {
    const navigate = useNavigate();
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
    
    const [availableDecks, setAvailableDecks] = useState<Deck[]>([]);
    const [selectedDecks, setSelectedDecks] = useState<number[]>([]);
    
    const [numQuestions, setNumQuestions] = useState<number>(10);
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [loadingDecks, setLoadingDecks] = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                setLoadingClasses(true);
                const fetchedClasses = await classAPI.getAllClasses();
                setClasses(fetchedClasses);
            } catch (error) {
                console.error("Failed to fetch classes", error);
            } finally {
                setLoadingClasses(false);
            }
        };
        fetchClasses();
    }, []);

    useEffect(() => {
        const fetchDecks = async () => {
            if (selectedClasses.length === 0) {
                setAvailableDecks([]);
                setSelectedDecks([]);
                return;
            }

            try {
                setLoadingDecks(true);
                const deckPromises = selectedClasses.map(classId => 
                    classAPI.getTeacherCourseFullData(classId)
                );
                
                const coursesData = await Promise.all(deckPromises);
                const allDecks = coursesData.flatMap(data => data.decks);
                
                // Deduplicate decks just in case
                const uniqueDecks = Array.from(new Map(allDecks.map(deck => [deck.id, deck])).values());
                setAvailableDecks(uniqueDecks);
                
                // Keep selected decks that are still available
                setSelectedDecks(prev => prev.filter(id => uniqueDecks.some(d => d.id === id)));
            } catch (error) {
                console.error("Failed to fetch decks", error);
            } finally {
                setLoadingDecks(false);
            }
        };

        fetchDecks();
    }, [selectedClasses]);

    const toggleClass = (classId: number) => {
        setSelectedClasses(prev => 
            prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
        );
    };

    const toggleDeck = (deckId: number) => {
        setSelectedDecks(prev => 
            prev.includes(deckId) ? prev.filter(id => id !== deckId) : [...prev, deckId]
        );
    };

    const totalAvailableCards = availableDecks
        .filter(deck => selectedDecks.includes(deck.id))
        .reduce((sum, deck) => sum + deck.cardCount, 0);

    const exceedsAvailable = selectedDecks.length > 0 && numQuestions > totalAvailableCards;

    const handleGenerate = async () => {
        if (selectedDecks.length === 0) {
            alert("Please select at least one deck.");
            return;
        }
        
        if (numQuestions <= 0) {
            alert("Number of questions must be greater than 0.");
            return;
        }

        if (exceedsAvailable) {
            alert(`You requested ${numQuestions} questions, but only ${totalAvailableCards} are available.`);
            return;
        }

        try {
            setGenerating(true);
            
            // Fetch cards for all selected decks
            const cardPromises = selectedDecks.map(deckId => flashcardAPI.getDeckCards(deckId, true));
            const cardsArrays = await Promise.all(cardPromises);
            const allCards = cardsArrays.flat();
            
            if (allCards.length === 0) {
                alert("The selected decks contain no cards.");
                setGenerating(false);
                return;
            }

            // In case cardCount was inaccurate and we actually have fewer cards than requested
            if (numQuestions > allCards.length) {
                alert(`Only ${allCards.length} questions are actually available. Generating quiz with ${allCards.length} questions instead.`);
            }

            // Shuffle array
            const shuffled = [...allCards].sort(() => 0.5 - Math.random());
            
            // Slice the requested number of questions (or max available)
            const selectedCards = shuffled.slice(0, Math.min(numQuestions, allCards.length));
            
            // Generate markdown
            let markdown = `# Generated Quiz\n\n`;
            markdown += `*Generated from ${selectedDecks.length} deck(s). Total questions: ${selectedCards.length}*\n\n`;
            
            selectedCards.forEach((card, index) => {
                markdown += `Q${index + 1}. ${card.front}\n\n\n`;
            });

            // Navigate to export page with state
            navigate('/teacher/quiz/export', { state: { markdown } });
            
        } catch (error) {
            console.error("Failed to generate quiz", error);
            alert("An error occurred while generating the quiz.");
            setGenerating(false);
        }
    };

    if (loadingClasses) {
        return (
            <div className="min-h-screen bg-neutral-50 center">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="container-custom py-8">
            <div className="mb-8">
                <h1>Generate Quiz</h1>
                <p className="text-neutral-600">Select classes and decks to randomly pick flashcards and generate a quiz.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Class Selection */}
                    <div className="card">
                        <div className="card-body">
                            <h2 className="text-xl font-semibold mb-4">1. Select Classes</h2>
                            {classes.length === 0 ? (
                                <p className="text-neutral-500 italic">No classes available.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {classes.map(cls => (
                                        <button
                                            key={cls.id}
                                            onClick={() => toggleClass(cls.id)}
                                            className={`p-4 rounded-lg border-2 text-left transition-all ${
                                                selectedClasses.includes(cls.id)
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-neutral-200 bg-white hover:border-primary-200'
                                            }`}
                                        >
                                            <div className="font-semibold text-neutral-900">{cls.name}</div>
                                            <div className="text-sm text-neutral-600">{cls.subject}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Deck Selection */}
                    <div className="card">
                        <div className="card-body">
                            <h2 className="text-xl font-semibold mb-4">2. Select Decks</h2>
                            {selectedClasses.length === 0 ? (
                                <p className="text-neutral-500 italic">Select classes first to view their decks.</p>
                            ) : loadingDecks ? (
                                <div className="flex justify-center py-8">
                                    <div className="spinner"></div>
                                </div>
                            ) : availableDecks.length === 0 ? (
                                <p className="text-neutral-500 italic">No decks available for the selected classes.</p>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-neutral-600">
                                            {availableDecks.length} deck(s) found
                                        </span>
                                        <button 
                                            onClick={() => {
                                                if (selectedDecks.length === availableDecks.length) {
                                                    setSelectedDecks([]);
                                                } else {
                                                    setSelectedDecks(availableDecks.map(d => d.id));
                                                }
                                            }}
                                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                        >
                                            {selectedDecks.length === availableDecks.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {availableDecks.map(deck => (
                                            <button
                                                key={deck.id}
                                                onClick={() => toggleDeck(deck.id)}
                                                className={`p-3 rounded-lg border-2 text-left transition-all ${
                                                    selectedDecks.includes(deck.id)
                                                        ? 'border-primary-500 bg-primary-50'
                                                        : 'border-neutral-200 bg-white hover:border-primary-200'
                                                }`}
                                            >
                                                <div className="font-medium text-neutral-900 truncate">{deck.title}</div>
                                                <div className="text-xs text-neutral-500 truncate">{deck.className}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="card sticky top-6">
                        <div className="card-body">
                            <h2 className="text-xl font-semibold mb-4">3. Quiz Settings</h2>
                            
                            <div className="form-group mb-6">
                                <label className="form-label">Number of Questions</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max={Math.max(1, totalAvailableCards)}
                                    value={numQuestions} 
                                    onChange={(e) => setNumQuestions(parseInt(e.target.value) || 0)}
                                    className={`form-input ${exceedsAvailable ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                />
                                {exceedsAvailable ? (
                                    <p className="text-xs text-red-500 mt-2">
                                        Cannot exceed the total available questions ({totalAvailableCards}).
                                    </p>
                                ) : (
                                    <p className="text-xs text-neutral-500 mt-2">
                                        Enter the number of questions for the quiz.
                                    </p>
                                )}
                            </div>

                            <div className="bg-neutral-50 p-4 rounded-lg mb-6">
                                <h3 className="text-sm font-semibold text-neutral-700 mb-2">Summary</h3>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex justify-between">
                                        <span className="text-neutral-600">Classes:</span>
                                        <span className="font-medium text-neutral-900">{selectedClasses.length}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-neutral-600">Decks:</span>
                                        <span className="font-medium text-neutral-900">{selectedDecks.length}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-neutral-600">Available Questions:</span>
                                        <span className="font-medium text-neutral-900">{totalAvailableCards}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-neutral-600">Target Questions:</span>
                                        <span className={`font-medium ${exceedsAvailable ? 'text-red-500' : 'text-neutral-900'}`}>{numQuestions}</span>
                                    </li>
                                </ul>
                            </div>

                            <button 
                                onClick={handleGenerate}
                                disabled={generating || selectedDecks.length === 0 || exceedsAvailable || numQuestions <= 0}
                                className="btn-primary w-full flex justify-center items-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {generating ? (
                                    <>
                                        <div className="spinner w-5 h-5 border-2 border-white border-t-transparent mr-2"></div>
                                        Generating...
                                    </>
                                ) : (
                                    'Generate & Preview'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
