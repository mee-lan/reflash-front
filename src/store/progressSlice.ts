import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { classAPI, deckAPI, flashcardAPI } from '../services/api'
import type { FlashCard } from '../types'

export interface ProgressStats {
  totalCards: number
  newCards: number
  learningCards: number
  reviewCards: number
  suspendedCards: number
  totalReps: number
  totalLapses: number
  averageEase: number
  dueToday: number
}

interface ProgressState {
  overall: ProgressStats | null
  byDeck: Record<number, ProgressStats>
  loading: boolean
  error: string | null
  lastFetched: number | null
}

const initialState: ProgressState = {
  overall: null,
  byDeck: {},
  loading: false,
  error: null,
  lastFetched: null,
}

// Create an async thunk to fetch all progress
export const fetchProgressStats = createAsyncThunk(
  'progress/fetchProgressStats',
  async (_, { rejectWithValue }) => {
    try {
      const classes = await classAPI.getAllClasses()
      const nowSeconds = Math.floor(Date.now() / 1000)

      let allCards: FlashCard[] = []
      const deckStatsMap: Record<number, ProgressStats> = {}

      for (const cls of classes) {
        const decks = await deckAPI.getClassDecks(cls.id)
        for (const deck of decks) {
          const cards = await flashcardAPI.getDeckCards(deck.id)
          
          // Math for 'today' relative to deck creation
          const deckToday = Math.floor((nowSeconds - (deck.crt || 0)) / 86400)
          
          // Calculate due status
          const cardsWithDue = cards.map(c => {
            let isDue = false
            if (c.queue === "REVIEW" && c.due <= deckToday) {
              isDue = true
            } else if (c.queue === "LEARNING" && c.due <= nowSeconds) {
              isDue = true
            }
            return { ...c, isDue }
          })

          // Calculate stats for this specific deck
          const newCards = cardsWithDue.filter(c => c.queue === "NEW").length
          const learningCards = cardsWithDue.filter(c => c.queue === "LEARNING").length
          const reviewCards = cardsWithDue.filter(c => c.queue === "REVIEW").length
          const suspendedCards = cardsWithDue.filter(c => c.queue === "SUSPENDED").length
          const totalReps = cardsWithDue.reduce((acc, c) => acc + (c.reps || 0), 0)
          const totalLapses = cardsWithDue.reduce((acc, c) => acc + (c.lapses || 0), 0)
          const reviewOnly = cardsWithDue.filter(c => c.queue === "REVIEW" || c.type === "REVIEW")
          const averageEase = reviewOnly.length > 0 
            ? reviewOnly.reduce((acc, c) => acc + (c.factor || 2500), 0) / reviewOnly.length 
            : 0
          const dueToday = cardsWithDue.filter(c => (c as any).isDue).length

          deckStatsMap[deck.id] = {
            totalCards: cardsWithDue.length,
            newCards,
            learningCards,
            reviewCards,
            suspendedCards,
            totalReps,
            totalLapses,
            averageEase,
            dueToday
          }

          allCards = [...allCards, ...cardsWithDue]
        }
      }

      // Calculate overall stats
      const newCards = allCards.filter(c => c.queue === "NEW").length
      const learningCards = allCards.filter(c => c.queue === "LEARNING").length
      const reviewCards = allCards.filter(c => c.queue === "REVIEW").length
      const suspendedCards = allCards.filter(c => c.queue === "SUSPENDED").length
      
      const totalReps = allCards.reduce((acc, c) => acc + (c.reps || 0), 0)
      const totalLapses = allCards.reduce((acc, c) => acc + (c.lapses || 0), 0)
      
      const reviewOnly = allCards.filter(c => c.queue === "REVIEW" || c.type === "REVIEW")
      const averageEase = reviewOnly.length > 0 
        ? reviewOnly.reduce((acc, c) => acc + (c.factor || 2500), 0) / reviewOnly.length 
        : 0

      const dueToday = allCards.filter(c => (c as any).isDue).length

      const overallStats: ProgressStats = {
        totalCards: allCards.length,
        newCards,
        learningCards,
        reviewCards,
        suspendedCards,
        totalReps,
        totalLapses,
        averageEase,
        dueToday
      }

      return {
        overall: overallStats,
        byDeck: deckStatsMap
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch progress stats')
    }
  }
)

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    invalidateProgress: (state) => {
      state.lastFetched = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProgressStats.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProgressStats.fulfilled, (state, action) => {
        state.loading = false
        state.overall = action.payload.overall
        state.byDeck = action.payload.byDeck
        state.lastFetched = Date.now()
      })
      .addCase(fetchProgressStats.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  }
})

export const { invalidateProgress } = progressSlice.actions
export default progressSlice.reducer