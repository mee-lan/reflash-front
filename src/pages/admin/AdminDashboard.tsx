import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import type { AdminCourseSummary } from '../../types'

export default function AdminDashboard() {
  const [courses, setCourses] = useState<AdminCourseSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true)
        setError(null)
        const fetchedCourses = await adminAPI.getAllCourses()
        setCourses(fetchedCourses)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load courses')
      } finally {
        setLoading(false)
      }
    }

    void loadCourses()
  }, [])

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <h1 className="mb-2">All Courses</h1>
      </div>

      {error && <div className="alert-error mb-6">{error}</div>}

      {loading ? (
        <div className="min-h-[240px] center">
          <div className="spinner"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">No courses found</h2>
            <p className="text-neutral-600">The backend returned an empty course list.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/admin/courses/edit?courseId=${course.id}`}
              className="card hover:no-underline hover:shadow-lg transition-all"
            >
              <div className="card-body">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 mb-2">
                      Course #{course.id}
                    </p>
                    <h2 className="text-xl font-semibold text-neutral-900">{course.name}</h2>
                  </div>
                  <span className="badge badge-primary">Grade {course.grade}</span>
                </div>

                <p className="text-neutral-600 line-clamp-3">
                  {course.description || 'No course description provided.'}
                </p>

                <div className="mt-6 pt-4 border-t border-neutral-200 flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Open course editor</span>
                  <span className="text-primary-600 font-medium">Edit</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
