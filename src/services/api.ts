import axios from 'axios'
import type { Class, Deck, FlashCard } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

//Axios instance
// const apiClient = axios.create({
//     baseURL: API_BASE_URL,
//     withCredentials: true,
//     headers: {
//         'Content-Type': 'application/json',
//     },
// })


//MOCK client without credentials for testing with json-server
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})


// apiClient.interceptors.response.use(
//     (response) => response,
//     (error) => {
//         if (error.response && error.response.status === 401) {
//             // Handle unauthorized error, e.g., redirect to login
//             window.location.href = '/login';
//         }
//         return Promise.reject(error);
//     }
// )


// //Class API object holding required methods for class related API calls
// export const classAPI = {

//     //Student: Get all enrolled classes
//     getStudentClasses: async (): Promise<Class[]> => {
//         const { data } = await apiClient.get('/student/classes')
//         return data;
//     },

//     //Teacher: Get all classes created by teacher
//     getTeacherClasses: async (): Promise<Class[]> => {
//         const { data } = await apiClient.get('/teacher/classes')
//         return data;
//     },

//     //Get single class
//     getClass: async (classId: string): Promise<Class> => {
//         const { data } = await apiClient.get(`/class/${classId}`)
//         return data;
//     },

//     //Create class
//     createClass: async (classData: {
//         name: string,
//         subject: string,
//         description?: string,
//         color: string
//     }): Promise<Class> => {

//         const { data } = await apiClient.post('/teacher/classes', classData)
//         return data;
//     },

//     // Join class (student only)
//     joinClass: async (classCode: string): Promise<Class> => {
//         const { data } = await apiClient.post('/student/classes/join', { classCode })
//         return data
//     },
// }


// // Deck APIs
// export const deckAPI = {
//     // Get all decks in a class
//     getClassDecks: async (classId: number): Promise<Deck[]> => {
//         const { data } = await apiClient.get(`/class/${classId}/decks`)
//         return data
//     },

//     // Get single deck
//     getDeck: async (deckId: number): Promise<Deck> => {
//         const { data } = await apiClient.get(`/deck/${deckId}`)
//         return data
//     },

//     // Create deck (teacher only)
//     createDeck: async (
//         classId: number,
//         deckData: { title: string; description?: string }
//     ): Promise<Deck> => {
//         const { data } = await apiClient.post(`/class/${classId}/decks`, deckData)
//         return data
//     },
// }


// // Flashcard APIs
// export const flashcardAPI = {
//     // Get all cards in a deck
//     getDeckCards: async (deckId: number): Promise<FlashCard[]> => {
//         const { data } = await apiClient.get(`/deck/${deckId}/cards`)
//         return data
//     },

//     // Rate a card (spaced repetition)
//     rateCard: async (
//         cardId: number,
//         difficulty: 'EASY' | 'MEDIUM' | 'HARD'
//     ): Promise<void> => {
//         await apiClient.post(`/card/${cardId}/rate`, { difficulty })
//     },

//     // Create card (teacher only)
//     createCard: async (
//         deckId: number,
//         cardData: { front: string; back: string; note?: string }
//     ): Promise<FlashCard> => {
//         const { data } = await apiClient.post(`/deck/${deckId}/cards`, cardData)
//         return data
//     },
// }




//MOCK code for testing with json-server - to be replaced with above code when backend is ready
// Class APIs
export const classAPI = {
  getAllClasses: async (): Promise<Class[]> => {
    const { data } = await apiClient.get('/classes')
    return data
  },

  getClass: async (classId: number): Promise<Class> => {
    const { data } = await apiClient.get(`/classes/${classId}`)
    return data
  },

  createClass: async (classData: {
    name: string
    subject: string
    description?: string
    color: string
  }): Promise<Class> => {
    const { data } = await apiClient.post('/classes', {
      ...classData,
      classCode: `CLASS${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      teacher: { id: 1, name: 'Current Teacher' },
      studentCount: 0,
      deckCount: 0,
      createdAt: new Date().toISOString()
    })
    return data
  },
}

// Deck APIs
export const deckAPI = {
  getClassDecks: async (classId: number): Promise<Deck[]> => {
    const { data } = await apiClient.get(`/decks?classId=${classId}`)
    return data
  },

  getDeck: async (deckId: number): Promise<Deck> => {
    const { data } = await apiClient.get(`/decks/${deckId}`)
    return data
  },

  createDeck: async (
    classId: number,
    deckData: { title: string; description?: string }
  ): Promise<Deck> => {
    const { data } = await apiClient.post('/decks', {
      ...deckData,
      classId,
      cardCount: 0,
      studiedCount: 0,
      dueCount: 0,
      createdAt: new Date().toISOString()
    })
    return data
  },
}

// Flashcard APIs
export const flashcardAPI = {
  getDeckCards: async (deckId: number): Promise<FlashCard[]> => {
    const { data } = await apiClient.get(`/cards?deckId=${deckId}`)
    return data
  },

  createCard: async (
    deckId: number,
    cardData: { front: string; back: string; note?: string }
  ): Promise<FlashCard> => {
    const { data } = await apiClient.post('/cards', {
      ...cardData,
      deckId,
      difficulty: 'MEDIUM',
      nextReviewDate: new Date().toISOString(),
      repetitions: 0,
      easeFactor: 2.5
    })
    return data
  },

  rateCard: async (
    cardId: number,
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  ): Promise<void> => {
    await apiClient.patch(`/cards/${cardId}`, { difficulty })
  },

  updateCard: async (
    cardId: number,
    cardData: { front: string; back: string; note?: string }
  ): Promise<FlashCard> => {
    const { data } = await apiClient.patch(`/cards/${cardId}`, cardData)
    return data
  }
}
export default apiClient


