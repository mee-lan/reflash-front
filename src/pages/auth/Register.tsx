// src/pages/auth/Register.tsx

import { useState } from 'react'
import { Link } from 'react-router-dom'

type UserRole = 'teacher' | 'student' | null

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: null as UserRole,
    agreedToTerms: false,
  })

  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    agreedToTerms: '',
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

  const handleRoleSelect = (role: 'teacher' | 'student') => {
    setFormData(prev => ({ ...prev, role }))
    setErrors(prev => ({ ...prev, role: '' }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const newErrors = {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
      agreedToTerms: '',
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.role) {
      newErrors.role = 'Please select your role'
    }

    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = 'You must agree to the terms and conditions'
    }

    const hasErrors = Object.values(newErrors).some(error => error !== '')
    
    if (hasErrors) {
      setErrors(newErrors)
      return
    }

    // TODO: Add Redux dispatch for registration
    console.log('Registration submitted:', formData)
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 py-12">
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
            Join Re-Flash
          </h1>
          <p className="text-neutral-600">
            Create your account to get started
          </p>
        </div>

        {/* Register Card */}
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Full Name Field */}
              <div className="form-group">
                <label htmlFor="fullName" className="form-label">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`form-input ${errors.fullName ? 'form-input-error' : ''}`}
                  placeholder="John Doe"
                />
                {errors.fullName && (
                  <p className="form-error">{errors.fullName}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="form-error">{errors.email}</p>
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

              {/* Confirm Password Field */}
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-input ${errors.confirmPassword ? 'form-input-error' : ''}`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="form-error">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Role Selection */}
              <div className="form-group">
                <label className="form-label mb-3">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Teacher Card */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('teacher')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      formData.role === 'teacher'
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-neutral-200 hover:border-primary-200 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        formData.role === 'teacher' ? 'bg-primary-500' : 'bg-neutral-200'
                      }`}>
                        <svg 
                          className={`w-6 h-6 ${formData.role === 'teacher' ? 'text-white' : 'text-neutral-600'}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                          />
                        </svg>
                      </div>
                      <span className={`font-medium ${
                        formData.role === 'teacher' ? 'text-primary-700' : 'text-neutral-700'
                      }`}>
                        Teacher
                      </span>
                    </div>
                  </button>

                  {/* Student Card */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('student')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      formData.role === 'student'
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-neutral-200 hover:border-primary-200 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        formData.role === 'student' ? 'bg-primary-500' : 'bg-neutral-200'
                      }`}>
                        <svg 
                          className={`w-6 h-6 ${formData.role === 'student' ? 'text-white' : 'text-neutral-600'}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M12 14l9-5-9-5-9 5 9 5z" 
                          />
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" 
                          />
                        </svg>
                      </div>
                      <span className={`font-medium ${
                        formData.role === 'student' ? 'text-primary-700' : 'text-neutral-700'
                      }`}>
                        Student
                      </span>
                    </div>
                  </button>
                </div>
                {errors.role && (
                  <p className="form-error mt-2">{errors.role}</p>
                )}
              </div>

              {/* Terms & Conditions */}
              <div className="form-group">
                <div className="flex items-start">
                  <input
                    id="agreedToTerms"
                    name="agreedToTerms"
                    type="checkbox"
                    checked={formData.agreedToTerms}
                    onChange={handleChange}
                    className="w-4 h-4 mt-0.5 text-primary-500 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="agreedToTerms" className="ml-2 text-sm text-neutral-700">
                    I agree to the{' '}
                    <a href="#" className="text-primary-600 hover:text-primary-700">
                      Terms of Service
                    </a>
                    {' '}and{' '}
                    <a href="#" className="text-primary-600 hover:text-primary-700">
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {errors.agreedToTerms && (
                  <p className="form-error mt-1">{errors.agreedToTerms}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-primary w-full"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>

        {/* Login Link */}
        <p className="text-center mt-6 text-neutral-600">
          Already have an account?{' '}
          <Link 
            to="/login" 
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}