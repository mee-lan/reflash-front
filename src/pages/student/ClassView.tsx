import { useParams, Link } from "react-router-dom"
import { useEffect, useState } from "react"
import type { Class, Deck } from "../../types"
import { DeckCard } from "../../components"
import { classAPI, deckAPI } from "../../services/api"


export default function ClassView() {
    const { classId } = useParams<{ classId: string }>()
    const [classData, setClassData] = useState<Class | null>(null)
    const [decks, setDecks] = useState<Deck[]>([])
    const [loading, setLoading] = useState(true)


    useEffect(() => {
        
        const fetchData = async () => {
            try {
                setLoading(true)

                const [classData, decks] = await Promise.all(
                    [classAPI.getClass(Number(classId)),
                    deckAPI.getClassDecks(Number(classId))
                    ]
                )
                setClassData(classData)
                setDecks(decks)
            } catch (error) {
                console.error("Failed to fetch data", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
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
            <div className="text-center">
                <h2>Class not found</h2>
                <Link to="/dashboard" className="link">Back to dashboard</Link>
            </div>
        )
    }

    return (
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
    )


}