export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMINISTRATOR'

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

export interface AdministratorUser {
  id: number
  firstName: string
  lastName: string
  username: string
  email: string
  role: 'ADMINISTRATOR'
}

export type AuthUser = StudentUser | TeacherUser | AdministratorUser

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
  createdAt: string,
  crt: number          // epoch seconds from backend
}

export interface FlashCard {
  id: number           // = note.noteId, always stable, never null
  schedulingId: number | null  // = flashcard.id, null for NEW cards
  deckId: number
  front: string
  back: string
  note?: string        // = additionalContext
  tags?: string[]
  type: 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING'
  queue: 'NEW' | 'LEARNING' | 'REVIEW' | 'SUSPENDED'
  ivl: number
  factor: number
  reps: number
  lapses: number
  left: number
  due: number
  dirty?: boolean
}

export interface AdminCourseSummary {
  id: number
  name: string
  description: string
  grade: string
  academicYear: string
  studentCount: number
  teacherCount: number
}

export interface AdminCourseFormData {
  courseName: string
  courseDescription: string
  grade: string
  academicYear: string
  teachers: TeacherUser[]
  students: StudentUser[]
}

export interface TeacherProfileFormData {
  firstName: string
  lastName: string
  username: string
  password: string
  email: string
}

export interface StudentProfileFormData {
  firstName: string
  lastName: string
  password: string
  grade: string
  section: string
  academicYear: string
  roll: string
}
