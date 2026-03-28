import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link } from "react-router-dom"
import { studentProfileAPI } from "../../services/api"
import type { AppDispatch, RootState } from "../../store/store"
import { updateUser } from "../../store/authSlice"
import type { StudentProfileEditData } from "../../types"

const emptyPasswordState = {
  oldPassword: '',
  newPassword: '',
  confirmNewPassword: '',
}

export default function StudentProfile() {
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((state: RootState) => state.auth.user)
  const [profile, setProfile] = useState<StudentProfileEditData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [passwords, setPasswords] = useState(emptyPasswordState)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        const profileData = await studentProfileAPI.getProfile()
        setProfile(profileData)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load student profile')
      } finally {
        setLoading(false)
      }
    }

    if (user?.role === 'STUDENT') {
      void loadProfile()
    } else {
      setLoading(false)
    }
  }, [user?.role])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!profile) {
      return
    }

    setError(null)
    setSuccess(null)

    if (!profile.firstName.trim() || !profile.lastName.trim()) {
      setError('First name and last name are required')
      return
    }

    if (!passwords.oldPassword.trim()) {
      setError('Current password is required to save changes')
      return
    }

    if (passwords.newPassword && passwords.newPassword !== passwords.confirmNewPassword) {
      setError('New password and confirmation do not match')
      return
    }

    try {
      setSaving(true)

      const payload: StudentProfileEditData = {
        ...profile,
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword.trim() || undefined,
        password: '',
      }

      const message = await studentProfileAPI.updateProfile(payload)
      setSuccess(message)
      setPasswords(emptyPasswordState)

      if (user?.role === 'STUDENT') {
        dispatch(updateUser({
          ...user,
          firstName: profile.firstName,
          lastName: profile.lastName,
        }))
      }

      const refreshedProfile = await studentProfileAPI.getProfile()
      setProfile(refreshedProfile)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save student profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 center">
        <div className="spinner"></div>
      </div>
    )
  }

  if (user?.role !== 'STUDENT') {
    return (
      <div className="container-custom py-8">
        <div className="card">
          <div className="card-body text-center py-12">
            <h1 className="mb-3">Profile editing is student-only</h1>
            <p className="text-neutral-600 mb-6">This frontend currently exposes the new profile endpoint only for student accounts.</p>
            <Link to={user?.role === 'TEACHER' ? '/teacher/dashboard' : '/admin/dashboard'} className="btn-primary inline-flex">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container-custom py-8">
        <div className="card">
          <div className="card-body text-center py-12">
            <h1 className="mb-3">Profile not available</h1>
            <p className="text-neutral-600">{error || 'Unable to load your student profile.'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <h1 className="mb-2">My Profile</h1>
        <p className="text-neutral-600">Review your student information and change your password from one place.</p>
      </div>

      {error && <div className="alert-error mb-6">{error}</div>}
      {success && <div className="alert-success mb-6">{success}</div>}

      <div className="grid grid-cols-1 gap-6">
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">Personal Info</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group mb-0">
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(event) => setProfile((current) => current ? { ...current, firstName: event.target.value } : current)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(event) => setProfile((current) => current ? { ...current, lastName: event.target.value } : current)}
                      className="form-input"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">Student Record</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm text-neutral-500 mb-1">Grade</p>
                    <p className="font-medium text-neutral-900">{profile.grade}</p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm text-neutral-500 mb-1">Section</p>
                    <p className="font-medium text-neutral-900">{profile.section}</p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm text-neutral-500 mb-1">Roll</p>
                    <p className="font-medium text-neutral-900">{profile.roll}</p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm text-neutral-500 mb-1">Academic Year</p>
                    <p className="font-medium text-neutral-900">{profile.academicYear}</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">Change Password</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group mb-0 md:col-span-2">
                    <label className="form-label">Current Password</label>
                    <input
                      type="password"
                      value={passwords.oldPassword}
                      onChange={(event) => setPasswords((current) => ({ ...current, oldPassword: event.target.value }))}
                      className="form-input"
                      placeholder="Required to save any profile change"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      value={passwords.newPassword}
                      onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))}
                      className="form-input"
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwords.confirmNewPassword}
                      onChange={(event) => setPasswords((current) => ({ ...current, confirmNewPassword: event.target.value }))}
                      className="form-input"
                    />
                  </div>
                </div>
              </section>

              <div className="pt-2">
                <button type="submit" className="btn-primary w-full md:w-auto" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
