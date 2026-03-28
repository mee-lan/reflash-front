import { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import type { AdminCourseFormData, StudentUser, TeacherUser } from '../../types'

const emptyCourseForm: AdminCourseFormData = {
  courseName: '',
  courseDescription: '',
  grade: '',
  academicYear: '',
  teachers: [],
  students: [],
}

type AdminCourseEditorProps = {
  mode: 'create' | 'edit'
  initialCourseId?: number | null
}

function getStudentLabel(student: StudentUser) {
  return `${student.firstName} ${student.lastName} • Grade ${student.grade}-${student.section} • Roll ${student.roll}`
}

function getTeacherLabel(teacher: TeacherUser) {
  return `${teacher.firstName} ${teacher.lastName} • ${teacher.username}`
}

export default function AdminCourseEditor({
  mode,
  initialCourseId = null,
}: AdminCourseEditorProps) {
  const [resolvedCourseId, setResolvedCourseId] = useState<number | null>(initialCourseId)
  const [formData, setFormData] = useState<AdminCourseFormData>(emptyCourseForm)
  const [teacherOptions, setTeacherOptions] = useState<TeacherUser[]>([])
  const [studentOptions, setStudentOptions] = useState<StudentUser[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState(true)
  const [loadingCourse, setLoadingCourse] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoadingTeachers(true)
        const teachers = await adminAPI.getTeachers()
        setTeacherOptions(teachers)
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load teachers')
      } finally {
        setLoadingTeachers(false)
      }
    }

    fetchTeachers()
  }, [])

  useEffect(() => {
    if (!formData.grade) {
      setStudentOptions([])
      setFormData((prev) => ({ ...prev, students: [] }))
      return
    }

    const fetchStudents = async () => {
      try {
        setLoadingStudents(true)
        const students = await adminAPI.getStudentsByGrade(formData.grade)
        setStudentOptions(students)
        setFormData((prev) => ({
          ...prev,
          students: prev.students.filter((selectedStudent) =>
            students.some((student) => student.id === selectedStudent.id)
          ),
        }))
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load students')
      } finally {
        setLoadingStudents(false)
      }
    }

    fetchStudents()
  }, [formData.grade])

  useEffect(() => {
    if (mode !== 'edit' || !initialCourseId) {
      return
    }

    const loadInitialCourse = async () => {
      await handleLoadCourse(initialCourseId)
    }

    void loadInitialCourse()
  }, [initialCourseId, mode])

  const handleLoadCourse = async (courseIdOverride?: number) => {
    const parsedCourseId = courseIdOverride ?? initialCourseId ?? null

    if (!parsedCourseId) {
      setError('Course not found')
      return
    }

    try {
      setLoadingCourse(true)
      setError(null)
      setSuccess(null)
      const course = await adminAPI.getCourseForEdit(parsedCourseId)
      setResolvedCourseId(course.courseId)
      setFormData({
        courseName: course.courseName,
        courseDescription: course.courseDescription,
        grade: course.grade,
        academicYear: course.academicYear,
        teachers: course.teachers,
        students: course.students,
      })
      setStudentOptions(course.students)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load course')
    } finally {
      setLoadingCourse(false)
    }
  }

  const toggleTeacher = (teacher: TeacherUser) => {
    setFormData((prev) => {
      const isSelected = prev.teachers.some((selectedTeacher) => selectedTeacher.id === teacher.id)
      return {
        ...prev,
        teachers: isSelected
          ? prev.teachers.filter((selectedTeacher) => selectedTeacher.id !== teacher.id)
          : [...prev.teachers, teacher],
      }
    })
  }

  const toggleStudent = (student: StudentUser) => {
    setFormData((prev) => {
      const isSelected = prev.students.some((selectedStudent) => selectedStudent.id === student.id)
      return {
        ...prev,
        students: isSelected
          ? prev.students.filter((selectedStudent) => selectedStudent.id !== student.id)
          : [...prev.students, student],
      }
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formData.courseName.trim()) {
      setError('Course name is required')
      return
    }

    if (!formData.courseDescription.trim()) {
      setError('Course description is required')
      return
    }

    if (!formData.grade.trim()) {
      setError('Grade is required')
      return
    }

    if (!formData.academicYear.trim()) {
      setError('Academic year is required')
      return
    }

    if (formData.teachers.length === 0) {
      setError('Assign at least one teacher')
      return
    }

    if (formData.students.length === 0) {
      setError('Assign at least one student')
      return
    }

    if (mode === 'edit' && !resolvedCourseId) {
      setError('Load a course before saving changes')
      return
    }

    try {
      setSubmitting(true)
      const message = mode === 'create'
        ? await adminAPI.createCourse(formData)
        : await adminAPI.updateCourse({
            courseId: resolvedCourseId as number,
            ...formData,
          })

      setSuccess(message)

      if (mode === 'create') {
        setFormData(emptyCourseForm)
        setStudentOptions([])
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save course')
    } finally {
      setSubmitting(false)
    }
  }

  const pageTitle = mode === 'create' ? 'Create Course' : 'Edit Course'
  const pageDescription = mode === 'create'
    ? 'Create a course and assign teachers plus grade-specific students.'
    : ''

  return (
    <div className="container-custom py-8">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="mb-2">{pageTitle}</h1>
          {pageDescription && <p className="text-neutral-600">{pageDescription}</p>}
        </div>
        <div className="card min-w-56">
          <div className="card-body py-4">
            <p className="text-sm text-neutral-600 mb-1">Assignments</p>
            <p className="text-2xl font-bold text-neutral-900">{formData.teachers.length} teachers</p>
            <p className="text-sm text-neutral-500">{formData.students.length} students selected</p>
          </div>
        </div>
      </div>

      {error && <div className="alert-error mb-6">{error}</div>}
      {success && <div className="alert-success mb-6">{success}</div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="card">
            <div className="card-body">
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">Course Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group mb-0">
                  <label className="form-label">Course Name</label>
                  <input
                    type="text"
                    value={formData.courseName}
                    onChange={(event) => setFormData((prev) => ({ ...prev, courseName: event.target.value }))}
                    className="form-input"
                    placeholder="e.g., Grade 10 Science"
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Academic Year</label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(event) => setFormData((prev) => ({ ...prev, academicYear: event.target.value }))}
                    className="form-input"
                    placeholder="e.g., 2025"
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Grade</label>
                  <input
                    type="text"
                    value={formData.grade}
                    onChange={(event) => setFormData((prev) => ({ ...prev, grade: event.target.value }))}
                    className="form-input"
                    placeholder="e.g., 10"
                  />
                </div>
                <div className="form-group mb-0 md:col-span-2">
                  <label className="form-label">Course Description</label>
                  <textarea
                    value={formData.courseDescription}
                    onChange={(event) => setFormData((prev) => ({ ...prev, courseDescription: event.target.value }))}
                    className="form-input"
                    rows={4}
                    placeholder="Summarize what this course covers"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-neutral-900">Assign Teachers</h3>
                <span className="badge badge-primary">{formData.teachers.length} selected</span>
              </div>

              {loadingTeachers ? (
                <div className="center py-8"><div className="spinner"></div></div>
              ) : teacherOptions.length === 0 ? (
                <div className="alert-info">No teachers are available yet.</div>
              ) : (
                <div className="space-y-3">
                  {teacherOptions.map((teacher) => {
                    const isSelected = formData.teachers.some((selectedTeacher) => selectedTeacher.id === teacher.id)
                    return (
                      <button
                        key={teacher.id}
                        type="button"
                        onClick={() => toggleTeacher(teacher)}
                        className={`w-full text-left border rounded-lg p-4 transition-colors ${
                          isSelected ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-primary-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-neutral-900">{getTeacherLabel(teacher)}</p>
                            <p className="text-sm text-neutral-500">{teacher.email}</p>
                          </div>
                          <span className={`badge ${isSelected ? 'badge-primary' : 'badge-info'}`}>
                            {isSelected ? 'Assigned' : 'Available'}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-neutral-900">Assign Students</h3>
                <span className="badge badge-secondary">Grade {formData.grade || '...'}</span>
              </div>

              {!formData.grade ? (
                <div className="alert-info">Enter a grade to fetch matching students.</div>
              ) : loadingStudents ? (
                <div className="center py-8"><div className="spinner"></div></div>
              ) : studentOptions.length === 0 ? (
                <div className="alert-warning">No students found for grade {formData.grade}.</div>
              ) : (
                <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
                  {studentOptions.map((student) => {
                    const isSelected = formData.students.some((selectedStudent) => selectedStudent.id === student.id)
                    return (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => toggleStudent(student)}
                        className={`w-full text-left border rounded-lg p-4 transition-colors ${
                          isSelected ? 'border-secondary-500 bg-secondary-50' : 'border-neutral-200 hover:border-secondary-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-neutral-900">{student.firstName} {student.lastName}</p>
                            <p className="text-sm text-neutral-500">{getStudentLabel(student)}</p>
                          </div>
                          <span className={`badge ${isSelected ? 'badge-secondary' : 'badge-info'}`}>
                            {isSelected ? 'Assigned' : 'Available'}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={submitting || loadingTeachers || loadingCourse || loadingStudents}
              >
                {submitting ? 'Saving...' : mode === 'create' ? 'Create Course' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
