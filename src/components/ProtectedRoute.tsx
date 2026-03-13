import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import type { AppDispatch, RootState } from '../store/store'
import { checkAuth } from '../store/authSlice'
import type { AuthUser, UserRole } from '../types'

function getHomeRoute(user: AuthUser | null) {
  return user?.role === 'TEACHER' ? '/teacher/dashboard' : '/dashboard'
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}) {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, loading, user } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    dispatch(checkAuth())
  }, [dispatch])

  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 center">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomeRoute(user)} replace />
  }

  return children
}
