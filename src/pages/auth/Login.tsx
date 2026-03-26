// src/pages/auth/Login.tsx

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import type { AppDispatch, RootState } from '../../store/store'
import { login } from '../../store/authSlice'
import type { UserRole } from '../../types'

export default function Login() {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isAuthenticated && user) {
      const destination = user.role === 'TEACHER'
        ? '/teacher/dashboard'
        : user.role === 'ADMINISTRATOR'
          ? '/admin/dashboard'
          : '/dashboard'
      navigate(destination, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const isAdminLogin = location.pathname === '/admin'
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    role: (isAdminLogin ? 'ADMINISTRATOR' : 'STUDENT') as UserRole,
    rememberMe: false,
  })

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      role: isAdminLogin ? 'ADMINISTRATOR' : (prev.role === 'ADMINISTRATOR' ? 'STUDENT' : prev.role)
    }))
  }, [isAdminLogin])

  const [errors, setErrors] = useState({
    identifier: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleRoleSelect = (role: UserRole) => {
    setFormData((prev) => ({
      ...prev,
      role,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation (we'll add Redux logic later)
    const newErrors = {
      identifier: '',
      password: '',
    }

    if (!formData.identifier) {
      newErrors.identifier = isAdminLogin ? 'Username is required' : 'Username is required'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (newErrors.identifier || newErrors.password) {
      setErrors(newErrors)
      return
    }

    try {
      const resultAction = await dispatch(login({
        identifier: formData.identifier,
        password: formData.password,
        role: formData.role,
      }))

      if (login.fulfilled.match(resultAction)) {
        const destination = resultAction.payload.role === 'TEACHER'
          ? '/teacher/dashboard'
          : resultAction.payload.role === 'ADMINISTRATOR'
            ? '/admin/dashboard'
            : '/dashboard'
        navigate(destination)
      } else {
        setErrors(prev => ({
          ...prev,
          password: isAdminLogin ? 'Invalid username or password' : 'Invalid username or password'
        }))
      }
    } catch {
      setErrors(prev => ({
        ...prev,
        password: 'Login failed'
      }))
    }

  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            {isAdminLogin ? 'Re-Flash Admin' : 'Welcome to Re-Flash'}
          </h1>
          <p className="text-neutral-600">
            {isAdminLogin ? 'Sign in to manage courses, teachers, and students' : 'Sign in to continue learning'}
          </p>
        </div>

        {/* Login Card */}
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Username Field */}
              <div className="form-group">
                <label htmlFor="identifier" className="form-label">
                  {isAdminLogin ? 'Username' : 'Username'}
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type='text'
                  value={formData.identifier}
                  onChange={handleChange}
                  className={`form-input ${errors.identifier ? 'form-input-error' : ''}`}
                  placeholder={isAdminLogin ? 'Enter admin username' : 'Enter username'}
                />
                {errors.identifier && (
                  <p className="form-error">{errors.identifier}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input ${errors.password ? 'form-input-error' : ''}`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="form-error">{errors.password}</p>
                )}
              </div>

              {!isAdminLogin && (
                <div className="form-group">
                  <p className="form-label mb-3">Login As</p>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${formData.role === 'STUDENT' ? 'border-primary-500 bg-primary-50' : 'border-neutral-300 bg-white'}`}>
                      <input
                        type="checkbox"
                        checked={formData.role === 'STUDENT'}
                        onChange={() => handleRoleSelect('STUDENT')}
                        className="w-4 h-4 text-primary-500 border-neutral-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-neutral-800">Student</span>
                    </label>

                    <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${formData.role === 'TEACHER' ? 'border-primary-500 bg-primary-50' : 'border-neutral-300 bg-white'}`}>
                      <input
                        type="checkbox"
                        checked={formData.role === 'TEACHER'}
                        onChange={() => handleRoleSelect('TEACHER')}
                        className="w-4 h-4 text-primary-500 border-neutral-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-neutral-800">Teacher</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-500 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="rememberMe" className="ml-2 text-sm text-neutral-700">
                    Remember me
                  </label>
                </div>

                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-primary w-full"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>

        {/* Register Link */}
        <p className="text-center mt-6 text-neutral-600">
          {isAdminLogin ? (
            <>
              Need student or teacher access?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                Go to standard login
              </Link>
            </>
          ) : (
            <>
              Looking for admin access?{' '}
              <Link
                to="/admin"
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                Use admin login
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  )
}