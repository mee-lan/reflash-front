import { useMemo } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import type { SearchTeacherResult } from '../../types'

const STORAGE_PREFIX = 'reflash-admin-search-teacher-'

export default function AdminTeacherProfileView() {
  const { teacherId } = useParams<{ teacherId: string }>()
  const location = useLocation()

  const teacher = useMemo(() => {
    const stateProfile = (location.state as { profile?: SearchTeacherResult } | null)?.profile

    if (stateProfile) {
      return stateProfile
    }

    if (!teacherId) {
      return null
    }

    const storedProfile = window.sessionStorage.getItem(`${STORAGE_PREFIX}${teacherId}`)
    return storedProfile ? (JSON.parse(storedProfile) as SearchTeacherResult) : null
  }, [location.state, teacherId])

  if (!teacher) {
    return (
      <div className="container-custom py-8">
        <div className="card">
          <div className="card-body text-center py-12">
            <h1 className="mb-3">Teacher not available</h1>
            <p className="text-neutral-600 mb-6">Open this page from admin search so the selected teacher data can be loaded.</p>
            <Link to="/admin/dashboard" className="btn-primary inline-flex">Back to dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <nav className="flex items-center gap-2 text-sm text-neutral-600 mb-6">
        <Link to="/admin/dashboard" className="hover:text-primary-600">Admin Dashboard</Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-neutral-900 font-medium">Teacher Profile</span>
      </nav>

      <div className="card">
        <div className="card-body">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="mb-2">{teacher.firstName} {teacher.lastName}</h1>
              <p className="text-neutral-600">Search result detail for teacher #{teacher.id}</p>
            </div>
            <Link to="/admin/teachers/create" className="btn-primary">Create Teacher</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-sm text-neutral-500 mb-1">Username</p>
              <p className="font-medium text-neutral-900">{teacher.username}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-sm text-neutral-500 mb-1">Email</p>
              <p className="font-medium text-neutral-900">{teacher.email}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-sm text-neutral-500 mb-1">Role</p>
              <p className="font-medium text-neutral-900">Teacher</p>
            </div>
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-sm text-neutral-500 mb-1">Backend ID</p>
              <p className="font-medium text-neutral-900">{teacher.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
