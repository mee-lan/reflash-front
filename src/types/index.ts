export type UserRole = 'STUDENT' | 'TEACHER'

export interface StudentUser {
  id: number
  firstName: string
  lastName: string
  grade: string
  section: string
  roll: string
  academicYear: string
  role: 'STUDENT'
}

export interface TeacherUser {
  id: number
  firstName: string
  lastName: string
  username: string
  email: string
  role: 'TEACHER'
}

export type AuthUser = StudentUser | TeacherUser

export interface ApiResponse<T> {
  message?: string
  mainBody?: T
}

export interface Class {
  id: number
  name: string
  subject: string
  description?: string
  color: string
  classCode: string
  teacher: {
    id: number
    name: string
  }
  studentCount: number
  deckCount: number
  createdAt: string
}

export interface Deck {
  id: number
  title: string
  description?: string
  classId: number
  className: string
  cardCount: number
  studiedCount: number
  dueCount: number
  createdAt: string
}

export interface FlashCard {
  id: number
  deckId: number
  front: string
  back: string
  note?: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  nextReviewDate: string
  repetitions: number
  easeFactor: number
}
