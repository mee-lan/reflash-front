import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import type { AppDispatch, RootState } from '../store/store'
import { checkAuth } from '../store/authSlice'
import type { AuthUser, UserRole } from '../types'

function getHomeRoute(user: AuthUser | null) {
  if (user?.role === 'TEACHER') {
    return '/teacher/dashboard'
  }

  if (user?.role === 'ADMINISTRATOR') {
    return '/admin/dashboard'
  }

  return '/dashboard'
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}) {
  const dispatch = useDispatch<AppDispatch>()
  const location = useLocation()
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
    const loginPath = location.pathname.startsWith('/admin') ? '/admin' : '/login'
    return <Navigate to={loginPath} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomeRoute(user)} replace />
  }

  return children
}
