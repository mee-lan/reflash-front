import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('search')?.toLowerCase() || ''

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

  const filteredClasses = useMemo(() => {
    if (!searchQuery) return classes;
    return classes.filter(c => 
      c.name.toLowerCase().includes(searchQuery) || 
      c.subject.toLowerCase().includes(searchQuery) ||
      (c.description && c.description.toLowerCase().includes(searchQuery))
    );
  }, [classes, searchQuery]);

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
        {filteredClasses.length === 0 ? (
          <div className="col-span-full card">
            <div className="card-body text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                {searchQuery ? 'No classes match your search' : 'No classes available'}
              </h3>
              <p className="text-neutral-600">
                {searchQuery ? 'Try adjusting your search terms' : 'You are not enrolled in any classes yet.'}
              </p>
            </div>
          </div>
        ) : (
          filteredClasses.map(classData => (
            <ClassCard key={classData.id} classData={classData} />
          ))
        )}
      </div>
    </div>
  )
}
