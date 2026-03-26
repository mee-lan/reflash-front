import { useState } from 'react'
import { adminAPI } from '../../services/api'
import type { StudentProfileFormData } from '../../types'

const emptyStudentProfile: StudentProfileFormData = {
  firstName: '',
  lastName: '',
  password: '',
  grade: '',
  section: '',
  academicYear: '',
  roll: '',
}

export default function AdminCreateStudentPage() {
  const [formData, setFormData] = useState<StudentProfileFormData>(emptyStudentProfile)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (Object.values(formData).some((value) => !value.trim())) {
      setError('All fields are required')
      return
    }

    try {
      setSubmitting(true)
      const message = await adminAPI.createStudentProfile(formData)
      setSuccess(message)
      setFormData(emptyStudentProfile)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create student profile')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <h1 className="mb-2">Create Student Profile</h1>
        <p className="text-neutral-600">
          Create a student account with the exact payload expected by `POST /api/admin/student-profile`.
        </p>
      </div>

      {error && <div className="alert-error mb-6">{error}</div>}
      {success && <div className="alert-success mb-6">{success}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group mb-0">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(event) => setFormData((prev) => ({ ...prev, firstName: event.target.value }))}
                  className="form-input"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(event) => setFormData((prev) => ({ ...prev, lastName: event.target.value }))}
                  className="form-input"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Roll</label>
                <input
                  type="text"
                  value={formData.roll}
                  onChange={(event) => setFormData((prev) => ({ ...prev, roll: event.target.value }))}
                  className="form-input"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                  className="form-input"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Grade</label>
                <input
                  type="text"
                  value={formData.grade}
                  onChange={(event) => setFormData((prev) => ({ ...prev, grade: event.target.value }))}
                  className="form-input"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Section</label>
                <input
                  type="text"
                  value={formData.section}
                  onChange={(event) => setFormData((prev) => ({ ...prev, section: event.target.value }))}
                  className="form-input"
                />
              </div>
              <div className="form-group mb-0 md:col-span-2">
                <label className="form-label">Academic Year</label>
                <input
                  type="text"
                  value={formData.academicYear}
                  onChange={(event) => setFormData((prev) => ({ ...prev, academicYear: event.target.value }))}
                  className="form-input"
                  placeholder="e.g., 2025"
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <button type="submit" className="btn-primary w-full md:w-auto" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Student Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Validation</h2>
            <div className="space-y-3 text-sm text-neutral-600">
              <p>All fields are required before submission.</p>
              <p>Grade, section, academic year, and roll are sent unchanged to the backend.</p>
              <p>Success and backend errors are shown inline to match the existing forms.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
