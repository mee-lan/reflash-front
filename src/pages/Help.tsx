import { BookOpen, Brain, Clock, Calendar, TrendingUp } from 'lucide-react';

export default function Help() {
    return (
        <div className="container-custom py-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Help & Glossary</h1>
            <p className="text-neutral-600 mb-8">
                Learn what the terms used in Re-Flash mean and how the spaced repetition system works.
            </p>

            <div className="space-y-6">
                <section className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
                    <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                        Card Types
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-neutral-800">New Cards</h3>
                            <p className="text-neutral-600 text-sm">Cards that you have never studied before.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-neutral-800">Learning Cards</h3>
                            <p className="text-neutral-600 text-sm">Cards that you are seeing for the first time or have recently forgotten. They are shown frequently until you can consistently remember them.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-neutral-800">Review Cards</h3>
                            <p className="text-neutral-600 text-sm">Cards that you have successfully learned. The system schedules these cards at increasing intervals (days, weeks, or months) to help you retain them in long-term memory.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-neutral-800">Suspended / Leeches</h3>
                            <p className="text-neutral-600 text-sm">Cards that you have forgotten many times. The system temporarily suspends them so you don't waste time on them. You might want to edit these cards to make them easier to remember.</p>
                        </div>
                    </div>
                </section>

                <section className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
                    <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-500" />
                        Study Buttons
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 border border-neutral-100 rounded-lg bg-red-50">
                            <h3 className="font-semibold text-red-700">Again</h3>
                            <p className="text-red-600 text-sm mt-1">You completely forgot the answer. The card will be shown to you very soon.</p>
                        </div>
                        <div className="p-4 border border-neutral-100 rounded-lg bg-orange-50">
                            <h3 className="font-semibold text-orange-700">Hard</h3>
                            <p className="text-orange-600 text-sm mt-1">You remembered the answer, but it took a lot of effort. The next review interval will be shorter.</p>
                        </div>
                        <div className="p-4 border border-neutral-100 rounded-lg bg-green-50">
                            <h3 className="font-semibold text-green-700">Good</h3>
                            <p className="text-green-600 text-sm mt-1">You remembered the answer easily. The card's interval will increase normally.</p>
                        </div>
                        <div className="p-4 border border-neutral-100 rounded-lg bg-blue-50">
                            <h3 className="font-semibold text-blue-700">Easy</h3>
                            <p className="text-blue-600 text-sm mt-1">The answer came to you instantly. The card's interval will increase significantly.</p>
                        </div>
                    </div>
                </section>

                <section className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
                    <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        Algorithm Terms
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-neutral-800">Ease Factor</h3>
                            <p className="text-neutral-600 text-sm">A multiplier that determines how quickly a card's interval grows when you answer "Good". It starts at 2.50x and adjusts based on how often you get the card right or wrong.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-neutral-800">Lapse</h3>
                            <p className="text-neutral-600 text-sm">When you forget a card that was previously in the "Review" stage (answering "Again").</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-neutral-800">Total Reps</h3>
                            <p className="text-neutral-600 text-sm">The total number of times you have answered any card.</p>
                        </div>
                    </div>
                </section>
                
                <section className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
                    <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-orange-500" />
                        Scheduling
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-neutral-800">Due Today</h3>
                            <p className="text-neutral-600 text-sm">Cards that have been scheduled for review today or are currently in the learning phase.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-neutral-800">Next Due / Next Session</h3>
                            <p className="text-neutral-600 text-sm">The exact time when the next card will be ready for you to study, based on the intervals chosen.</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}