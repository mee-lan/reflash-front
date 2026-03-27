import { useEffect, useState } from 'react'
import { classAPI } from '../../services/api'
import type { StudentUser, Class } from '../../types'

type StudentWithClasses = StudentUser & { classes: Class[] }

export default function TeacherStudents() {
  const [students, setStudents] = useState<StudentWithClasses[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        const classes = await classAPI.getAllClasses()
        
        const studentsMap = new Map<number, StudentWithClasses>()
        
        await Promise.all(
          classes.map(async (cls) => {
            try {
              const courseData = await classAPI.getTeacherCourseFullData(cls.id)
              courseData.students.forEach((student) => {
                if (studentsMap.has(student.id)) {
                  const existing = studentsMap.get(student.id)!
                  // Avoid duplicate class entries
                  if (!existing.classes.find(c => c.id === cls.id)) {
                    existing.classes.push(cls)
                  }
                } else {
                  studentsMap.set(student.id, { ...student, classes: [cls] })
                }
              })
            } catch (err) {
              console.error(`Failed to fetch data for class ${cls.id}:`, err)
            }
          })
        )
        
        setStudents(Array.from(studentsMap.values()))
      } catch (err) {
        console.error('Failed to fetch students:', err)
        setError('Failed to load students. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchStudents()
  }, [])

  const filteredStudents = students.filter(student => 
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.roll?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 center">
        <div className="spinner border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="mb-2">My Students</h1>
          <p className="text-neutral-600">
            View and manage all students enrolled in your classes
          </p>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search students..."
            className="form-input pl-10 w-full sm:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      ) : null}

      <div className="card overflow-hidden">
        {students.length === 0 ? (
          <div className="card-body text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Students Found</h3>
            <p className="text-neutral-500 max-w-md mx-auto">
              You don't have any students enrolled in your classes yet.
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="card-body text-center py-16 text-neutral-500">
            No students match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="py-4 px-6 font-semibold text-neutral-900">Name</th>
                  <th className="py-4 px-6 font-semibold text-neutral-900">Roll No.</th>
                  <th className="py-4 px-6 font-semibold text-neutral-900">Grade & Section</th>
                  <th className="py-4 px-6 font-semibold text-neutral-900">Enrolled Classes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-neutral-900">
                        {student.firstName} {student.lastName}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-neutral-600">
                      {student.roll || '-'}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Grade {student.grade}
                        {student.section ? ` - ${student.section}` : ''}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-2">
                        {student.classes.map((cls) => (
                          <span 
                            key={cls.id} 
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-neutral-100 text-neutral-700"
                            title={cls.subject}
                          >
                            {cls.name}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}