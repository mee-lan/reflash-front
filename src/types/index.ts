export interface User {
  id: number
  username: string
  email: string
  firstname: string
  lastname: string
  role: 'STUDENT' | 'TEACHER'
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