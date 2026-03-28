import { useMemo } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import type { SearchStudentResult } from '../../types'

const STORAGE_PREFIX = 'reflash-admin-search-student-'

export default function AdminStudentProfileView() {
  const { studentId } = useParams<{ studentId: string }>()
  const location = useLocation()

  const student = useMemo(() => {
    const stateProfile = (location.state as { profile?: SearchStudentResult } | null)?.profile

    if (stateProfile) {
      return stateProfile
    }

    if (!studentId) {
      return null
    }

    const storedProfile = window.sessionStorage.getItem(`${STORAGE_PREFIX}${studentId}`)
    return storedProfile ? (JSON.parse(storedProfile) as SearchStudentResult) : null
  }, [location.state, studentId])

  if (!student) {
    return (
      <div className="container-custom py-8">
        <div className="card">
          <div className="card-body text-center py-12">
            <h1 className="mb-3">Student not available</h1>
            <p className="text-neutral-600 mb-6">Open this page from admin search so the selected student data can be loaded.</p>
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
        <span className="text-neutral-900 font-medium">Student Profile</span>
      </nav>

      <div className="card">
        <div className="card-body">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="mb-2">{student.firstName} {student.lastName}</h1>
              <p className="text-neutral-600">Search result detail for student #{student.id}</p>
            </div>
            <Link to="/admin/students/create" className="btn-primary">Create Student</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-sm text-neutral-500 mb-1">Roll</p>
              <p className="font-medium text-neutral-900">{student.roll}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-sm text-neutral-500 mb-1">Academic Year</p>
              <p className="font-medium text-neutral-900">{student.academicYear}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-sm text-neutral-500 mb-1">Grade</p>
              <p className="font-medium text-neutral-900">{student.grade}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-sm text-neutral-500 mb-1">Section</p>
              <p className="font-medium text-neutral-900">{student.section}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
