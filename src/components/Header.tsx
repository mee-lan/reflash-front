import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import type { AppDispatch, RootState } from "../store/store";
import { useEffect, useRef, useState } from "react";
import { logout } from "../store/authSlice";
import { globalSearchAPI } from "../services/api";
import type {
    GlobalSearchAdminResult,
    GlobalSearchResult,
    SearchCardResult,
    SearchCourseResult,
    SearchStudentResult,
    SearchTeacherResult,
} from "../types";

type SearchItem =
    | { id: string; kind: 'course'; title: string; subtitle: string; badge: 'Course'; payload: SearchCourseResult }
    | { id: string; kind: 'deck'; title: string; subtitle: string; badge: 'Deck'; payload: { deckId: number } }
    | { id: string; kind: 'card'; title: string; subtitle: string; badge: 'Card'; payload: SearchCardResult }
    | { id: string; kind: 'teacher'; title: string; subtitle: string; badge: 'Teacher'; payload: SearchTeacherResult }
    | { id: string; kind: 'student'; title: string; subtitle: string; badge: 'Student'; payload: SearchStudentResult }

const ADMIN_TEACHER_STORAGE_PREFIX = 'reflash-admin-search-teacher-'
const ADMIN_STUDENT_STORAGE_PREFIX = 'reflash-admin-search-student-'

function mapSearchItems(
    result: GlobalSearchResult | GlobalSearchAdminResult,
    role: string
): SearchItem[] {
    const items: SearchItem[] = []

    items.push(
        ...(result.courses || []).map((course) => ({
            id: `course-${course.courseId}`,
            kind: 'course' as const,
            title: course.courseName,
            subtitle: course.courseDescription || `Course #${course.courseId}`,
            badge: 'Course' as const,
            payload: course,
        }))
    )

    if (role === 'ADMINISTRATOR') {
        const adminResult = result as GlobalSearchAdminResult

        items.push(
            ...(adminResult.teachers || []).map((teacher) => ({
                id: `teacher-${teacher.id}`,
                kind: 'teacher' as const,
                title: `${teacher.firstName} ${teacher.lastName}`,
                subtitle: `${teacher.username} • ${teacher.email}`,
                badge: 'Teacher' as const,
                payload: teacher,
            })),
            ...(adminResult.students || []).map((student) => ({
                id: `student-${student.id}`,
                kind: 'student' as const,
                title: `${student.firstName} ${student.lastName}`,
                subtitle: `Roll ${student.roll} • Grade ${student.grade}${student.section ? `-${student.section}` : ''}`,
                badge: 'Student' as const,
                payload: student,
            }))
        )

        return items
    }

    const userResult = result as GlobalSearchResult

    items.push(
        ...(userResult.decks || []).map((deck) => ({
            id: `deck-${deck.deckId}`,
            kind: 'deck' as const,
            title: deck.deckName,
            subtitle: deck.deckDescription || `Deck #${deck.deckId}`,
            badge: 'Deck' as const,
            payload: { deckId: deck.deckId },
        })),
        ...(userResult.notes || []).map((note) => ({
            id: `card-${note.noteId}`,
            kind: 'card' as const,
            title: note.front,
            subtitle: note.back,
            badge: 'Card' as const,
            payload: note,
        }))
    )

    return items
}

export default function Header({ toggleSidebar }: { toggleSidebar?: () => void }) {
    const navigate = useNavigate()
    const location = useLocation()
    const [searchParams, setSearchParams] = useSearchParams()
    const dispatch = useDispatch<AppDispatch>()
    const user = useSelector((state: RootState) => state.auth.user)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true)
    const [searchItems, setSearchItems] = useState<SearchItem[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchError, setSearchError] = useState<string | null>(null)
    const [showSearchDropdown, setShowSearchDropdown] = useState(false)
    const [pendingItemId, setPendingItemId] = useState<string | null>(null)
    const searchContainerRef = useRef<HTMLDivElement | null>(null)

    const searchQuery = searchParams.get('search') || ''

    useEffect(() => {
        const trimmedQuery = searchQuery.trim()

        if (!trimmedQuery || !user?.role) {
            setSearchItems([])
            setSearchLoading(false)
            setSearchError(null)
            setShowSearchDropdown(false)
            return
        }

        const timer = window.setTimeout(async () => {
            try {
                setSearchLoading(true)
                setSearchError(null)
                const result = await globalSearchAPI.search(trimmedQuery)
                setSearchItems(mapSearchItems(result, user.role))
                setShowSearchDropdown(true)
            } catch (error) {
                setSearchItems([])
                setSearchError(error instanceof Error ? error.message : 'Search failed')
                setShowSearchDropdown(true)
            } finally {
                setSearchLoading(false)
            }
        }, 250)

        return () => window.clearTimeout(timer)
    }, [searchQuery, user?.role])

    useEffect(() => {
        setShowSearchDropdown(false)
    }, [location.pathname])

    useEffect(() => {
        const handleDocumentClick = (event: MouseEvent) => {
            if (!searchContainerRef.current?.contains(event.target as Node)) {
                setShowSearchDropdown(false)
            }
        }

        document.addEventListener('mousedown', handleDocumentClick)
        return () => document.removeEventListener('mousedown', handleDocumentClick)
    }, [])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const newSearchParams = new URLSearchParams(searchParams);
        if (value) {
            newSearchParams.set('search', value);
            setShowSearchDropdown(true)
        } else {
            newSearchParams.delete('search');
            setSearchItems([])
            setSearchError(null)
            setShowSearchDropdown(false)
        }
        setSearchParams(newSearchParams, { replace: true });
    }

    const handleSearchSelect = async (item: SearchItem) => {
        if (!user?.role) {
            return
        }

        try {
            setPendingItemId(item.id)
            setShowSearchDropdown(false)

            if (item.kind === 'course') {
                navigate(
                    user.role === 'TEACHER'
                        ? `/teacher/class/${item.payload.courseId}`
                        : user.role === 'ADMINISTRATOR'
                            ? `/admin/courses/edit?courseId=${item.payload.courseId}`
                            : `/class/${item.payload.courseId}`
                )
                return
            }

            if (item.kind === 'deck') {
                navigate(user.role === 'TEACHER' ? `/teacher/deck/${item.payload.deckId}` : `/browse/${item.payload.deckId}`)
                return
            }

            if (item.kind === 'card') {
                navigate(await globalSearchAPI.resolveCardDestination(item.payload.noteId))
                return
            }

            if (item.kind === 'teacher') {
                window.sessionStorage.setItem(
                    `${ADMIN_TEACHER_STORAGE_PREFIX}${item.payload.id}`,
                    JSON.stringify(item.payload)
                )
                navigate(`/admin/teachers/${item.payload.id}`, { state: { profile: item.payload } })
                return
            }

            window.sessionStorage.setItem(
                `${ADMIN_STUDENT_STORAGE_PREFIX}${item.payload.id}`,
                JSON.stringify(item.payload)
            )
            navigate(`/admin/students/${item.payload.id}`, { state: { profile: item.payload } })
        } catch (error) {
            setSearchError(error instanceof Error ? error.message : 'Unable to open result')
            setShowSearchDropdown(true)
        } finally {
            setPendingItemId(null)
        }
    }

    const displayName = user ? `${user.firstName} ${user.lastName}` : 'User'
    const subtitle = user?.role === 'TEACHER'
        ? 'Teacher'
        : user?.role === 'ADMINISTRATOR'
            ? 'Administrator'
            : user
                ? `Grade ${user.grade} • Section ${user.section}`
                : 'Student'
    const detailText = user?.role === 'TEACHER' || user?.role === 'ADMINISTRATOR'
        ? `${user.email} • ${user.username}`
        : user
            ? `Roll ${user.roll} • ${user.academicYear}`
            : ''
    const getSearchPlaceholder = () => {
        if (user?.role === 'ADMINISTRATOR') return 'Search courses, teachers, students...'
        if (location.pathname.includes('/teacher/class/')) return 'Search courses, decks, cards...'
        if (location.pathname.includes('/class/')) return 'Search courses, decks, cards...'
        return 'Search courses, decks, cards...'
    }
    const searchPlaceholder = getSearchPlaceholder()
    const initials = user
        ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
        : 'U'

    const handleLogout = async () => {
        await dispatch(logout())
        navigate(user?.role === 'ADMINISTRATOR' ? '/admin' : "/login")
    }

    return (
        <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 h-20 flex items-center">
            <div className="px-6 w-full">
                <div className="flex items-center justify-between gap-4">
                    {toggleSidebar && (
                        <button
                            onClick={toggleSidebar}
                            className="p-2 -ml-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                            title="Toggle Sidebar"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    )}

                    <div className="flex-1 max-w-xl" ref={searchContainerRef}>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onFocus={() => {
                                    if (searchQuery.trim()) {
                                        setShowSearchDropdown(true)
                                    }
                                }}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />

                            {showSearchDropdown && (
                                <div className="absolute left-0 right-0 mt-2 max-h-96 overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg z-50">
                                    {searchLoading && (
                                        <div className="px-4 py-3 text-sm text-neutral-500">Searching...</div>
                                    )}

                                    {!searchLoading && searchError && (
                                        <div className="px-4 py-3 text-sm text-red-600">{searchError}</div>
                                    )}

                                    {!searchLoading && !searchError && searchItems.length === 0 && (
                                        <div className="px-4 py-3 text-sm text-neutral-500">No matching results</div>
                                    )}

                                    {!searchLoading && !searchError && searchItems.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => void handleSearchSelect(item)}
                                            className="w-full border-b border-neutral-100 last:border-b-0 px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
                                            disabled={pendingItemId === item.id}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-neutral-900">{item.title}</p>
                                                    <p className="truncate text-xs text-neutral-500">{item.subtitle}</p>
                                                </div>
                                                <span className="shrink-0 rounded-full border border-primary-200 bg-primary-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-700">
                                                    {pendingItemId === item.id ? 'Opening' : item.badge}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 ml-6">
                        <Link
                            to="/help"
                            className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                            title="Help & Glossary"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </Link>

                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowNotifications(!showNotifications)
                                    setHasUnreadNotifications(false)
                                    if (showUserMenu) setShowUserMenu(false)
                                }}
                                className="relative p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                {hasUnreadNotifications && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 animate-slide-down">
                                    <div className="px-4 py-3 border-b border-neutral-200">
                                        <h3 className="text-sm font-semibold text-neutral-900">Notifications</h3>
                                    </div>
                                    <div className="p-4 text-center">
                                        <svg className="w-12 h-12 text-neutral-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                        <p className="text-sm text-neutral-500">No new notifications</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowUserMenu(!showUserMenu)
                                    if (showNotifications) setShowNotifications(false)
                                }}
                                className="flex items-center gap-3 p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                            >
                                <div className="w-8 h-8 bg-primary-500 rounded-full center text-white font-medium">
                                    {initials}
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-neutral-900">{displayName}</p>
                                    <p className="text-xs text-neutral-500">{subtitle}</p>
                                </div>
                                <svg
                                    className={`w-4 h-4 text-neutral-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 animate-slide-down">
                                    <div className="px-4 py-3 border-b border-neutral-200">
                                        <p className="text-sm font-medium text-neutral-900">{displayName}</p>
                                        <p className="text-xs text-neutral-500">{detailText}</p>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false)
                                            navigate('/profile')
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Profile
                                    </button>

                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false)
                                            navigate('/settings')
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Settings
                                    </button>

                                    <div className="border-t border-neutral-200 my-2"></div>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>

    )
}
