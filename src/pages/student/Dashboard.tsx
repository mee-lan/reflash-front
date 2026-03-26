import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ClassCard from "../../components/ClassCard";
import type { Class } from "../../types";
import { classAPI } from "../../services/api";
import type { AppDispatch, RootState } from "../../store/store";
import { fetchProgressStats } from "../../store/progressSlice";

export default function Dashboard() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setloading] = useState(true)
  const user = useSelector((state: RootState) => state.auth.user)
  const dispatch = useDispatch<AppDispatch>()
  const progressLoaded = useSelector((state: RootState) => state.progress.lastFetched)

  useEffect(() => {
    if (!progressLoaded) {
      dispatch(fetchProgressStats())
    }
  }, [dispatch, progressLoaded])

  useEffect(() => {
  const fetchClasses = async () => {
    try {
      setloading(true)
      const data = await classAPI.getAllClasses()
      setClasses(data)
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    } finally {
      setloading(false)
    }
  }

  fetchClasses()
}, [])

  if (loading) {
    return (
        <div className="min-h-screen bg-neutral-50 center">
          <div className="spinner"></div>
        </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <h1 className="mb-2">
        {user ? `${user.firstName}'s Classes` : 'My Classes'}
      </h1>
      <p className="text-neutral-600 mb-8">
        {user?.role === 'STUDENT'
          ? `Grade ${user.grade} • Section ${user.section} • Roll ${user.roll}`
          : 'Choose a class to start studying'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(classData => (
          <ClassCard key={classData.id} classData={classData} />
        ))}
      </div>
    </div>
  )
}
