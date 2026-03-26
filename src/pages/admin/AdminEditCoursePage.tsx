import { useSearchParams } from 'react-router-dom'
import AdminCourseEditor from './AdminCourseEditor'

export default function AdminEditCoursePage() {
  const [searchParams] = useSearchParams()
  const rawCourseId = searchParams.get('courseId')
  const initialCourseId = rawCourseId ? Number(rawCourseId) : null

  return <AdminCourseEditor mode="edit" initialCourseId={initialCourseId} />
}
