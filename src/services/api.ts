import axios from 'axios'
import type { ApiResponse, AuthUser, Class, Deck, FlashCard, UserRole } from '../types'
import { AUTH_STORAGE_KEY } from '../store/authSlice'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const CLASS_CACHE_KEY = 'reflash-classes'
const DECK_CACHE_KEY = 'reflash-decks'
const FLASHCARD_CACHE_KEY = 'reflash-flashcards'

type BackendCourse = {
  id?: number
  courseId?: number
  couresId?: number
  name?: string
  courseName?: string
  courseDescription?: string
  grade?: string
  deckCount?: number
  studentCount?: number
  teacherNames?: string[]
}

type BackendDeck = {
  id?: number
  name?: string
  description?: string
  cardCount?: number
  deckId?: number
  deckName?: string
  deckDescription?: string
}

type BackendAICard = {
  front?: string
  back?: string
  additionalContext?: string
}

type BackendFlashCardNote = {
  noteId: number
  front: string
  back: string
  additionalContext?: string
  tags?: string[]
  crt: number
}

type BackendFlashCard = {
  id: number | null
  note: BackendFlashCardNote
  type: string
  queue: string
  ivl: number
  factor: number
  reps: number
  lapses: number
  left: number
  due: number
  dirty: boolean
}

type BackendFlashCardResponse = {
  flashcards: BackendFlashCard[]
  deckId: number
  courseName: string
  deckName: string
  crt: number
}

type BackendNote = {
  noteId: number
  front: string
  back: string
  additionalContext?: string
  tags?: string[]
  crt?: number
}

function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const rawAuth = window.localStorage.getItem(AUTH_STORAGE_KEY)
    return rawAuth ? (JSON.parse(rawAuth).user as AuthUser | null) : null
  } catch {
    return null
  }
}

function getCurrentRole(): UserRole {
  return getStoredUser()?.role || 'STUDENT'
}

function getDisplayName(user: AuthUser | null) {
  if (!user) {
    return 'Current Teacher'
  }

  return `${user.firstName} ${user.lastName}`
}

function readCache<T>(key: string): T[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(key)
    return rawValue ? (JSON.parse(rawValue) as T[]) : []
  } catch {
    return []
  }
}

function writeCache<T>(key: string, value: T[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

function cacheClasses(classes: Class[]) {
  writeCache(CLASS_CACHE_KEY, classes)
}

function getCachedClasses() {
  return readCache<Class>(CLASS_CACHE_KEY)
}

function cacheDecks(decks: Deck[]) {
  const existingDecks = readCache<Deck>(DECK_CACHE_KEY)
  const mergedDecks = [
    ...existingDecks.filter((existingDeck) => !decks.some((deck) => deck.id === existingDeck.id)),
    ...decks,
  ]
  writeCache(DECK_CACHE_KEY, mergedDecks)
}

function getCachedDecks() {
  return readCache<Deck>(DECK_CACHE_KEY)
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const role = getStoredUser()?.role

  if (role) {
    config.headers.set('role', role)
  }

  return config
})

function getCourseColor(index: number) {
  const colors = ['blue', 'green', 'red', 'purple', 'orange', 'teal']
  return colors[index % colors.length]
}

function mapCourseToClass(course: BackendCourse, index: number): Class {
  const user = getStoredUser()
  const courseId = course.id ?? course.courseId ?? course.couresId ?? index + 1
  const courseName = course.name || course.courseName || `Course ${courseId}`
  const teacherName =
    user?.role === 'TEACHER'
      ? getDisplayName(user)
      : course.teacherNames?.join(', ') || 'Assigned Teacher'

  return {
    id: courseId,
    name: courseName,
    subject: course.grade ? `Grade ${course.grade}` : 'General',
    description: course.courseDescription || `${courseName} course`,
    color: getCourseColor(index),
    classCode: `COURSE-${courseId}`,
    teacher: {
      id: user?.role === 'TEACHER' ? user.id : 0,
      name: teacherName,
    },
    studentCount: course.studentCount ?? 0,
    deckCount: course.deckCount ?? 0,
    createdAt: new Date().toISOString(),
  }
}

function mapDeckToDeckModel(deck: BackendDeck, courseId: number): Deck {
  const relatedClass = getCachedClasses().find((course) => course.id === courseId)
  const deckId = deck.deckId ?? deck.id ?? Date.now()
  const deckTitle = deck.deckName ?? deck.name ?? `Deck ${deckId}`
  const deckDescription = deck.deckDescription ?? deck.description ?? `${deckTitle} deck`
  const cardCount = deck.cardCount ?? 0

  return {
    id: deckId,
    title: deckTitle,
    description: deckDescription,
    classId: courseId,
    className: relatedClass?.name || `Course ${courseId}`,
    cardCount,
    studiedCount: 0,
    dueCount: 0,
    createdAt: new Date().toISOString(),
  }
}

function getCourseEndpoint(role: UserRole) {
  return role === 'TEACHER' ? '/api/teacher/courses' : '/api/student/courses'
}

function getDeckEndpoint(role: UserRole, courseId: number) {
  const routePrefix = role === 'TEACHER' ? '/api/teacher/decks' : '/api/student/decks'
  return `${routePrefix}?courseId=${courseId}`
}

export const classAPI = {
  getAllClasses: async (): Promise<Class[]> => {
    const role = getCurrentRole()
    const { data } = await apiClient.get<ApiResponse<BackendCourse[]>>(getCourseEndpoint(role))
    const courseList = Array.isArray(data.mainBody) ? data.mainBody : []
    const courses = courseList.map((course, index) => mapCourseToClass(course, index))

    cacheClasses(courses)
    return courses
  },

  getClass: async (classId: number): Promise<Class> => {
    const cachedClass = getCachedClasses().find((classData) => classData.id === classId)

    if (cachedClass) {
      return cachedClass
    }

    const classes = await classAPI.getAllClasses()
    const selectedClass = classes.find((classData) => classData.id === classId)

    if (!selectedClass) {
      throw new Error('Class not found')
    }

    return selectedClass
  },

  createClass: async (classData: {
    name: string
    subject: string
    description?: string
    color: string
  }): Promise<Class> => {
    const user = getStoredUser()
    const newClass: Class = {
      id: Date.now(),
      name: classData.name,
      subject: classData.subject,
      description: classData.description || 'Custom class',
      color: classData.color,
      classCode: `CLASS${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      teacher: {
        id: user?.role === 'TEACHER' ? user.id : 1,
        name: user?.role === 'TEACHER' ? getDisplayName(user) : 'Current Teacher',
      },
      studentCount: 0,
      deckCount: 0,
      createdAt: new Date().toISOString(),
    }

    cacheClasses([...getCachedClasses(), newClass])
    return newClass
  },
}

export const deckAPI = {
  getClassDecks: async (classId: number): Promise<Deck[]> => {
    const role = getCurrentRole()
    const { data } = await apiClient.get<ApiResponse<BackendDeck[]>>(getDeckEndpoint(role, classId))
    const deckList = Array.isArray(data.mainBody) ? data.mainBody : []
    const decks = deckList.map((deck) => mapDeckToDeckModel(deck, classId))

    cacheDecks(decks)
    return decks
  },

  getDeck: async (deckId: number): Promise<Deck> => {
    const cachedDeck = getCachedDecks().find((deck) => deck.id === deckId)

    if (!cachedDeck) {
      throw new Error('Deck not found')
    }

    return cachedDeck
  },

  createDeck: async (
    classId: number,
    deckData: { title: string; description?: string }
  ): Promise<Deck> => {
    const role = getCurrentRole()

    if (role === 'TEACHER') {
      await apiClient.post('/api/teacher/empty-deck', {
        deckName: deckData.title,
        deckDescription: deckData.description || '',
        courseId: classId,
      })

      // Refetch decks to get real deckId from backend
      const { data } = await apiClient.get<ApiResponse<BackendDeck[]>>(
        getDeckEndpoint('TEACHER', classId)
      )
      const deckList = Array.isArray(data.mainBody) ? data.mainBody : []
      const decks = deckList.map((deck) => mapDeckToDeckModel(deck, classId))
      cacheDecks(decks)

      // Return the last one — newest
      return decks[decks.length - 1]
    }

    const newDeck: Deck = {
      id: Date.now(),
      title: deckData.title,
      description: deckData.description || `${deckData.title} deck`,
      classId,
      className: getCachedClasses().find((course) => course.id === classId)?.name || `Course ${classId}`,
      cardCount: 0,
      studiedCount: 0,
      dueCount: 0,
      createdAt: new Date().toISOString(),
    }

    cacheDecks([...getCachedDecks(), newDeck])
    return newDeck
  },
}

export const flashcardAPI = {

  getDeckCards: async (deckId: number): Promise<FlashCard[]> => {
    const role = getCurrentRole()

    if (role === 'TEACHER') {
      const { data } = await apiClient.get<ApiResponse<BackendNote[]>>(
        `/api/teacher/notes-by-deck?deckId=${deckId}`
      )

      const notes = Array.isArray(data.mainBody) ? data.mainBody : []

      return notes.map((note): FlashCard => ({
        id: note.noteId,
        schedulingId: null,
        deckId,
        front: note.front,
        back: note.back,
        note: note.additionalContext,
        tags: note.tags ?? [],
        type: 'NEW',
        queue: 'NEW',
        ivl: 0,
        factor: 0,
        reps: 0,
        lapses: 0,
        difficulty: 'MEDIUM',
        nextReviewDate: new Date().toISOString(),
        repetitions: 0,
        easeFactor: 0,
      }))
    }

    const { data } = await apiClient.get<ApiResponse<BackendFlashCardResponse>>(
      `/api/student/flashcards?deckId=${deckId}`
    )

    const flashcards = data.mainBody?.flashcards ?? []

    return flashcards.map((card): FlashCard => ({
      id: card.note.noteId,
      schedulingId: card.id,
      deckId,
      front: card.note.front,
      back: card.note.back,
      note: card.note.additionalContext,
      tags: card.note.tags ?? [],
      type: card.type as FlashCard['type'],
      queue: card.queue as FlashCard['queue'],
      ivl: card.ivl,
      factor: card.factor,
      reps: card.reps,
      lapses: card.lapses,
      difficulty: 'MEDIUM',
      nextReviewDate: new Date(card.due * 1000).toISOString(),
      repetitions: card.reps,
      easeFactor: card.factor,
    }))
  },

  createCard: async (
    deckId: number,
    cardData: { front: string; back: string; note?: string }
  ): Promise<FlashCard> => {
    const role = getCurrentRole()

    if (role === 'TEACHER') {
      await apiClient.post('/api/teacher/note', {
        deckId,
        front: cardData.front,
        back: cardData.back,
        additionalContext: cardData.note,
      })

      // Refetch notes to get the real noteId from backend
      const { data } = await apiClient.get<ApiResponse<BackendNote[]>>(
        `/api/teacher/notes-by-deck?deckId=${deckId}`
      )
      const notes = Array.isArray(data.mainBody) ? data.mainBody : []
      const created = notes[notes.length - 1] // last note is the newest

      return {
        id: created.noteId,
        schedulingId: null,
        deckId,
        front: created.front,
        back: created.back,
        note: created.additionalContext,
        tags: created.tags ?? [],
        type: 'NEW',
        queue: 'NEW',
        ivl: 0,
        factor: 0,
        reps: 0,
        lapses: 0,
        difficulty: 'MEDIUM',
        nextReviewDate: new Date().toISOString(),
        repetitions: 0,
        easeFactor: 0,
      }
    }

    // Student/cache path (unchanged)
    const newCard: FlashCard = {
      id: Date.now(),
      schedulingId: null,
      deckId,
      front: cardData.front,
      back: cardData.back,
      note: cardData.note,
      tags: [],
      type: 'NEW',
      queue: 'NEW',
      ivl: 0,
      factor: 0,
      reps: 0,
      lapses: 0,
      difficulty: 'MEDIUM',
      nextReviewDate: new Date().toISOString(),
      repetitions: 0,
      easeFactor: 0,
    }

    const cacheKey = `${FLASHCARD_CACHE_KEY}-${deckId}`
    writeCache(cacheKey, [...readCache<FlashCard>(cacheKey), newCard])
    return newCard
  },
  rateCard: async (
    _cardId: number,
    _difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  ): Promise<void> => {
    return
  },

  updateCard: async (
    cardId: number,
    deckId: number,
    cardData: { front: string; back: string; note?: string }
  ): Promise<FlashCard> => {
    const role = getCurrentRole()

    if (role === 'TEACHER') {
      const { data } = await apiClient.get<ApiResponse<BackendNote[]>>(
        `/api/teacher/notes-by-deck?deckId=${deckId}`
      )
      const notes = Array.isArray(data.mainBody) ? data.mainBody : []

      const updatedNotes = notes.map((n) =>
        n.noteId === cardId
          ? { noteId: n.noteId, front: cardData.front, back: cardData.back, additionalContext: cardData.note, tags: n.tags }
          : { noteId: n.noteId, front: n.front, back: n.back, additionalContext: n.additionalContext, tags: n.tags }
      )

      const deck = getCachedDecks().find((d) => d.id === deckId)

      await apiClient.put('/api/teacher/edit-deck', {
        deckId,
        deckName: deck?.title,
        deckDescription: deck?.description,
        notes: updatedNotes,
      })

      return {
        id: cardId,
        schedulingId: null,
        deckId,
        front: cardData.front,
        back: cardData.back,
        note: cardData.note,
        tags: [],
        type: 'NEW',
        queue: 'NEW',
        ivl: 0,
        factor: 0,
        reps: 0,
        lapses: 0,
        difficulty: 'MEDIUM',
        nextReviewDate: new Date().toISOString(),
        repetitions: 0,
        easeFactor: 0,
      }
    }

    // Cache path for non-teacher
    const allDecks = getCachedDecks()

    for (const deck of allDecks) {
      const cacheKey = `${FLASHCARD_CACHE_KEY}-${deck.id}`
      const cards = readCache<FlashCard>(cacheKey)
      const targetCard = cards.find((card) => card.id === cardId)

      if (!targetCard) {
        continue
      }

      const updatedCard = { ...targetCard, ...cardData }
      writeCache(
        cacheKey,
        cards.map((card) => (card.id === cardId ? updatedCard : card))
      )
      return updatedCard
    }

    throw new Error('Card not found')
  },
}

export const aiAPI = {
  generateFlashcards: async (payload: { text: string; count: number }): Promise<
    Array<{ question: string; answer: string; hint: string }>
  > => {
    const { data } = await apiClient.post<ApiResponse<BackendAICard[]>>('/api/ai/generate-flashcards', payload)
    const generatedCards = Array.isArray(data.mainBody) ? data.mainBody : []

    return generatedCards.map((card) => ({
      question: card.front || '',
      answer: card.back || '',
      hint: card.additionalContext || '',
    }))
  },
}

export default apiClient
