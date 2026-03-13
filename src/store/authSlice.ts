import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { ApiResponse, AuthUser, UserRole } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const AUTH_STORAGE_KEY = 'reflash-auth'

type AuthState = {
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  user: AuthUser | null
}

type StoredAuthState = Pick<AuthState, 'isAuthenticated' | 'user'>

function loadStoredAuth(): StoredAuthState {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, user: null }
  }

  try {
    const rawState = window.localStorage.getItem(AUTH_STORAGE_KEY)

    if (!rawState) {
      return { isAuthenticated: false, user: null }
    }

    return JSON.parse(rawState) as StoredAuthState
  } catch {
    return { isAuthenticated: false, user: null }
  }
}

function persistAuthState(state: StoredAuthState) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state))
}

function clearStoredAuthState() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

const storedAuth = loadStoredAuth()

export const login = createAsyncThunk(
  'auth/login',
  async (
    { email, password, role }: { email: string; password: string; role: UserRole }
  ) => {
    const credentials = btoa(`${email}:${password}`)

    const response = await fetch(`${API_URL}/login`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${credentials}`,
        role,
      },
      credentials: 'include',
    })

    const data: ApiResponse<AuthUser> = await response.json()

    if (!response.ok || !data.mainBody) {
      throw new Error(data.message || 'Login failed')
    }

    return data.mainBody
  }
)

export const checkAuth = createAsyncThunk('auth/check', async () => {
  const response = await fetch(`${API_URL}/isAuthenticated`, {
    credentials: 'include',
  })

  if (!response.ok) {
    return false
  }

  const data: ApiResponse<null> = await response.json()
  return data.message === 'true'
})

export const logout = createAsyncThunk('auth/logout', async () => {
  await fetch(`${API_URL}/api/logout`, { credentials: 'include' })
})

const initialState: AuthState = {
  isAuthenticated: storedAuth.isAuthenticated,
  loading: false,
  error: null,
  user: storedAuth.user,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload
        persistAuthState({
          isAuthenticated: true,
          user: action.payload,
        })
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        state.error = action.error.message || 'Invalid credentials'
        clearStoredAuthState()
      })
      .addCase(checkAuth.pending, (state) => {
        state.loading = true
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = action.payload && Boolean(state.user)

        if (!state.isAuthenticated) {
          state.user = null
          clearStoredAuthState()
          return
        }

        persistAuthState({
          isAuthenticated: true,
          user: state.user,
        })
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        clearStoredAuthState()
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false
        state.user = null
        clearStoredAuthState()
      })
  },
})

export default authSlice.reducer
export type { AuthState }
export { AUTH_STORAGE_KEY }
