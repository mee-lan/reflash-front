import { useParams, Link } from "react-router-dom"
import { useEffect, useState } from "react"
import type { Class, Deck } from "../../types"
import { DeckCard } from "../../components"


export default function ClassView() {
    const { classId } = useParams<{ classId: string }>()
    const [classData, setClassData] = useState<Class | null>(null)
    const [decks, setDecks] = useState<Deck[]>([])
    const [loading, setLoading] = useState(true)


    useEffect(() => {
        // Mock data
        // TODO: Replace with API call
        setTimeout(() => {
            setClassData({
                id: Number(classId),
                name: 'Biology 101',
                subject: 'Science',
                description: 'Introduction to cellular biology and genetics',
                color: 'green',
                classCode: 'BIO101',
                teacher: { id: 1, name: 'Dr. Sarah Johnson' },
                studentCount: 24,
                deckCount: 5,
                createdAt: '2024-01-15'
            })

            setDecks([
                {
                    id: 1,
                    title: 'Chapter 1: Cell Structure',
                    description: 'Learn about cell organelles and functions',
                    classId: Number(classId),
                    className: 'Biology 101',
                    cardCount: 25,
                    studiedCount: 18,
                    dueCount: 5,
                    createdAt: '2024-01-16'
                },
                {
                    id: 2,
                    title: 'Chapter 2: DNA & Genetics',
                    description: 'DNA structure and genetic inheritance',
                    classId: Number(classId),
                    className: 'Biology 101',
                    cardCount: 30,
                    studiedCount: 10,
                    dueCount: 12,
                    createdAt: '2024-01-18'
                },
                {
                    id: 3,
                    title: 'Chapter 3: Cellular Respiration',
                    description: 'How cells generate energy',
                    classId: Number(classId),
                    className: 'Biology 101',
                    cardCount: 20,
                    studiedCount: 0,
                    dueCount: 0,
                    createdAt: '2024-01-20'
                }
            ])
            setLoading(false)
        }, 500)
    }, [classId])


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
                    <Link to="/dashboard" className="link">Back to dashboard</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="container-custom py-8">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-neutral-600 mb-6">
                    <Link to="/dashboard" className="hover:text-primary-600">
                        My Classes
                    </Link>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-neutral-900 font-medium">{classData.name}</span>
                </nav>

                {/* Class Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <h1>{classData.name}</h1>
                        <span className="badge badge-primary">{classData.subject}</span>
                    </div>
                    {classData.description && (
                        <p className="text-neutral-600 mb-3">{classData.description}</p>
                    )}
                    <p className="text-sm text-neutral-600">
                        Teacher: <span className="font-medium">{classData.teacher.name}</span>
                    </p>
                </div>

                {/* Decks Section */}
                <div>
                    <h2 className="mb-6">Study Decks</h2>

                    {decks.length === 0 ? (
                        <div className="card">
                            <div className="card-body text-center py-12">
                                <p className="text-neutral-600">No decks available yet</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {decks.map(deck => (
                                <DeckCard key={deck.id} deck={deck} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )


}