import { createAsyncThunk,createSlice } from "@reduxjs/toolkit";

const API_URL = 'http://localhost:8080';

export const login = createAsyncThunk(
    'auth/login',
    async ({ email, password }: { email: string, password: string }) => {
        const credentials = btoa(`${email}:${password}`)

        console.log('API CALLED')

        const response = await fetch(`${API_URL}/login`, {
            method: 'GET',
            headers: { 'Authorization': `Basic ${credentials}` },
            credentials: 'include'
        })
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message);
        }
        return await data;
    }
)


export const checkAuth = createAsyncThunk('auth/check', async () => {
    const response = await fetch(`${API_URL}/isAuthenticated`, {
        credentials: 'include'
    })
    const data = await response.json()
    return data.message === 'true'
})

export const logout = createAsyncThunk('auth/logout', async () => {
    await fetch(`${API_URL}/api/logout`, { credentials: 'include' })
})

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        isAuthenticated: false,
        loading: false,
        error: null as string | null,
    },
    reducers:{
    },
    extraReducers:(builder) => {
        builder
        .addCase(login.pending,(state)=>{state.loading=true,state.error=null})
        .addCase(login.fulfilled,(state)=>{state.loading=false,state.isAuthenticated=true})
        .addCase(login.rejected,(state)=>{state.loading=false,state.error='Invalid Credentials'})
        .addCase(checkAuth.fulfilled,(state,action)=>{state.isAuthenticated=action.payload})
        .addCase(logout.fulfilled,(state)=>{state.isAuthenticated=false})
    }
})

export default authSlice.reducer