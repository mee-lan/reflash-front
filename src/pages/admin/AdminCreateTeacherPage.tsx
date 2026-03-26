import { useState } from 'react'
import { adminAPI } from '../../services/api'
import type { TeacherProfileFormData } from '../../types'

const emptyTeacherProfile: TeacherProfileFormData = {
  firstName: '',
  lastName: '',
  username: '',
  password: '',
  email: '',
}

export default function AdminCreateTeacherPage() {
  const [formData, setFormData] = useState<TeacherProfileFormData>(emptyTeacherProfile)
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
      const message = await adminAPI.createTeacherProfile(formData)
      setSuccess(message)
      setFormData(emptyTeacherProfile)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create teacher profile')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <h1 className="mb-2">Create Teacher Profile</h1>
        <p className="text-neutral-600">
          Create a teacher account with the payload expected by `POST /api/admin/teacher-profile`.
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
                <label className="form-label">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(event) => setFormData((prev) => ({ ...prev, username: event.target.value }))}
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
              <div className="form-group mb-0 md:col-span-2">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <button type="submit" className="btn-primary w-full md:w-auto" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Teacher Profile'}
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
              <p>Username and email are preserved exactly as entered for the backend request.</p>
              <p>Backend success and validation errors are surfaced inline on the page.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
