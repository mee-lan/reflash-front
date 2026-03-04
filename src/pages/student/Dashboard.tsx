import { useEffect, useState } from "react";
import ClassCard from "../../components/ClassCard";
import type { Class } from "../../types";
import { classAPI } from "../../services/api";

export default function Dashboard() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setloading] = useState(true)

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
      <h1 className="mb-2">My Classes</h1>
      <p className="text-neutral-600 mb-8">Choose a class to start studying</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(classData => (
          <ClassCard key={classData.id} classData={classData} />
        ))}
      </div>
    </div>
  )
}