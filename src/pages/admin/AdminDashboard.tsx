import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const adminActions = [
  {
    title: 'Create Course',
    description: 'Build a new course and assign teachers plus students by grade.',
    to: '/admin/courses/create',
  },
  {
    title: 'Edit Course',
    description: 'Load a full course payload by ID and submit changes back to the backend.',
    to: '/admin/courses/edit',
  },
  {
    title: 'Create Student Profile',
    description: 'Create a student profile from the admin panel with grade, section, and roll details.',
    to: '/admin/students/create',
  },
  {
    title: 'Create Teacher Profile',
    description: 'Create teacher accounts with username, email, and password.',
    to: '/admin/teachers/create',
  },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [courseId, setCourseId] = useState('')

  const handleQuickEdit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!courseId.trim()) {
      return
    }

    navigate(`/admin/courses/edit?courseId=${encodeURIComponent(courseId)}`)
  }

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <h1 className="mb-2">Admin Dashboard</h1>
        <p className="text-neutral-600">
          Manage courses, teacher profiles, and student profiles from one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {adminActions.map((action) => (
          <Link key={action.to} to={action.to} className="card hover:no-underline">
            <div className="card-body h-full flex flex-col">
              <p className="text-sm uppercase tracking-wide text-primary-600 font-semibold mb-2">Admin Tool</p>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">{action.title}</h3>
              <p className="text-neutral-600 flex-1">{action.description}</p>
              <span className="mt-6 inline-flex items-center text-sm font-medium text-primary-600">
                Open tool
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="card-body">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Quick Course Edit</h2>
            <p className="text-neutral-600 mb-6">
              The backend does not expose an admin course list endpoint, so course editing starts with a course ID.
            </p>
            <form onSubmit={handleQuickEdit} className="flex flex-col md:flex-row gap-4">
              <input
                type="number"
                min="1"
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
                className="form-input flex-1"
                placeholder="Enter course ID"
              />
              <button type="submit" className="btn-primary">
                Load Course
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Backend Contract</h2>
            <div className="space-y-3 text-sm text-neutral-600">
              <p>`POST /api/admin/course` expects teacher and student ID arrays.</p>
              <p>`GET /api/admin/course-full` returns the full edit payload.</p>
              <p>`PUT /api/admin/edit-course` expects the full course object including teacher and student DTO arrays.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
