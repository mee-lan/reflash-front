import type { Class } from "../types";
import { Link } from "react-router-dom";

interface ClassCardProps {
    classData: Class
}

const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    teal: 'from-teal-500 to-teal-600',
}

export default function ClassCard({ classData }: ClassCardProps) {
    const gradientClass = colorClasses[classData.color as keyof typeof colorClasses] || colorClasses.blue

    return (
        <Link
            to={`/class/${classData.id}`}
            className="block group"
        >
            <div className="card hover:shadow-xl transition-all duration-300 overflow-hidden">
                {/* Header with gradient */}
                <div className={`h-24 bg-gradient-to-br ${gradientClass} p-4 relative`}>
                    <h3 className="text-white font-bold text-xl mb-1">
                        {classData.name}
                    </h3>
                    <p className="text-white/90 text-sm">
                        {classData.subject}
                    </p>

                    {/* Decorative pattern */}
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <circle cx="50" cy="50" r="40" fill="white" />
                        </svg>
                    </div>
                </div>

                {/* Body */}
                <div className="card-body">
                    {classData.description && (
                        <p className="text-neutral-600 text-sm mb-4 line-clamp-2">
                            {classData.description}
                        </p>
                    )}

                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-neutral-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span>{classData.deckCount} decks</span>
                            </div>

                            <div className="flex items-center gap-1 text-neutral-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <span>{classData.studentCount} students</span>
                            </div>
                        </div>

                        <div className="text-neutral-500">
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-neutral-200">
                        <p className="text-xs text-neutral-500">
                            Teacher: <span className="font-medium text-neutral-700">{classData.teacher.name}</span>
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    )
}