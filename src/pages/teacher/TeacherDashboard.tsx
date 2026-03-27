import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { Class } from "../../types";
import { Link, useSearchParams } from "react-router-dom";
import { classAPI } from "../../services/api";
import type { RootState } from "../../store/store";

export default function TeacherDashboard() {
    const [classes, setClasses] = useState<Class[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const user = useSelector((state: RootState) => state.auth.user)
    const [searchParams] = useSearchParams()
    const searchQuery = searchParams.get('search')?.toLowerCase() || ''

    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        description: '',
        color: 'blue'
    })

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const newClass = await classAPI.createClass(formData)

            // Add to local state
            setClasses([...classes, newClass])

            //Reset form
            setShowCreateModal(false)
            setFormData({
                name: '',
                subject: '',
                description: '',
                color: 'blue'
            })

            console.log('Class created:', newClass)

        }
        catch (error) {
            console.error('Error creating class:', error)
            alert('Failed to create class. Please try again.')
        }
    }

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                setLoading(true)
                const data = await classAPI.getAllClasses()
                setClasses(data)
            } catch (error) {
                console.error("Error fetching classes:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchClasses()
    }, [])

    const filteredClasses = useMemo(() => {
        if (!searchQuery) return classes;
        return classes.filter(c => 
            c.name.toLowerCase().includes(searchQuery) || 
            c.subject.toLowerCase().includes(searchQuery) ||
            (c.description && c.description.toLowerCase().includes(searchQuery))
        );
    }, [classes, searchQuery]);

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 center">
                <div className="spinner"></div>
            </div>
        )
    }

    return (
        <div className="container-custom py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="mb-2">
                        {user ? `${user.firstName}'s Classes` : 'My Classes'}
                    </h1>
                    <p className="text-neutral-600">
                        {user?.role === 'TEACHER'
                            ? `${user.email} • ${user.username}`
                            : 'Manage your classes and student progress'}
                    </p>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Class
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card">
                    <div className="card-body">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600 mb-1">Total Classes</p>
                                <p className="text-3xl font-bold text-neutral-900">{classes.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-primary-100 rounded-lg center">
                                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600 mb-1">Total Students</p>
                                <p className="text-3xl font-bold text-neutral-900">
                                    {classes.reduce((sum, c) => sum + c.studentCount, 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-neutral-600 mb-1">Total Decks</p>
                                <p className="text-3xl font-bold text-neutral-900">
                                    {classes.reduce((sum, c) => sum + c.deckCount, 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Classes Grid */}
            <div>
                <h2 className="mb-6">Your Classes</h2>

                {filteredClasses.length === 0 ? (
                    <div className="card">
                        <div className="card-body text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                                {searchQuery ? 'No classes match your search' : 'No classes yet'}
                            </h3>
                            <p className="text-neutral-600 mb-6">
                                {searchQuery ? 'Try adjusting your search terms' : 'Create your first class to get started'}
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="btn-primary"
                                >
                                    Create Class
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClasses.map(classData => (
                            <TeacherClassCard key={classData.id} classData={classData} />
                        ))}
                    </div>
                )}
            </div>
            {/* Create Class Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 center z-50 p-4">
                    <div className="card max-w-lg w-full animate-scale-in">
                        <div className="card-body">
                            <div className="flex items-center justify-between mb-6">
                                <h2>Create New Class</h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-neutral-400 hover:text-neutral-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleCreateClass} className="space-y-4">
                                {/* Class Name */}
                                <div className="form-group">
                                    <label className="form-label">Class Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="form-input"
                                        placeholder="e.g., Biology 101"
                                        required
                                    />
                                </div>

                                {/* Subject */}
                                <div className="form-group">
                                    <label className="form-label">Subject *</label>
                                    <input
                                        type="text"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="form-input"
                                        placeholder="e.g., Science"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="form-input"
                                        placeholder="Brief description of the class..."
                                        rows={3}
                                    />
                                </div>

                                {/* Color Picker */}
                                <div className="form-group">
                                    <label className="form-label">Class Color</label>
                                    <div className="grid grid-cols-5 gap-3">
                                        {['blue', 'green', 'red', 'purple', 'orange'].map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, color })}
                                                className={`h-12 rounded-lg transition-all ${formData.color === color
                                                    ? 'ring-4 ring-offset-2 ring-primary-500 scale-110'
                                                    : 'hover:scale-105'
                                                    } bg-gradient-to-br ${color === 'blue' ? 'from-blue-500 to-blue-600' :
                                                        color === 'green' ? 'from-green-500 to-green-600' :
                                                            color === 'red' ? 'from-red-500 to-red-600' :
                                                                color === 'purple' ? 'from-purple-500 to-purple-600' :
                                                                    'from-orange-500 to-orange-600'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="btn-ghost flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary flex-1">
                                        Create Class
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Teacher's version of ClassCard (with edit/delete options)
function TeacherClassCard({ classData }: { classData: Class }) {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        red: 'from-red-500 to-red-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-orange-600',
    }

    const gradientClass = colorClasses[classData.color as keyof typeof colorClasses] || colorClasses.blue

    return (
        <Link to={`/teacher/class/${classData.id}`} className="block group">
            <div className="card hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className={`h-24 bg-gradient-to-br ${gradientClass} p-4 relative`}>
                    <h3 className="text-white font-bold text-xl mb-1">{classData.name}</h3>
                    <p className="text-white/90 text-sm">{classData.subject}</p>
                </div>

                <div className="card-body">
                    {classData.description && (
                        <p className="text-neutral-600 text-sm mb-4 truncate-2">{classData.description}</p>
                    )}

                    <div className="flex items-center justify-between text-sm mb-3">
                        <div className="flex items-center gap-4">
                            <span className="text-neutral-600">{classData.deckCount} decks</span>
                            <span className="text-neutral-600">{classData.studentCount} students</span>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-neutral-200">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-500">
                                Code: <span className="font-mono font-bold text-neutral-900">{classData.classCode}</span>
                            </span>
                            <svg className="w-5 h-5 text-neutral-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
