import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Navigate } from 'react-router-dom'
import type { AppDispatch, RootState } from '../store/store'
import { checkAuth } from '../store/authSlice'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const dispatch = useDispatch<AppDispatch>()
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

    useEffect(() => {
        dispatch(checkAuth())
    }, [dispatch])

    return isAuthenticated ? children : <Navigate to="/login" />
}