import { useEffect, useState } from "react";
import ClassCard from "../../components/ClassCard";
import type { Class } from "../../types";

export default function Dashboard() {
    const [classes, setClasses] = useState<Class[]>([])
    const [loading, setloading] = useState(true)

    useEffect(() => {
        // Mock data for testing - we'll replace this with API later

        setTimeout(() => {
            setClasses([
                {
                    id: 1,
                    name: 'Biology 101',
                    subject: 'Science',
                    description: 'Introduction to cellular biology and genetics',
                    color: 'green',
                    classCode: 'BIO101',
                    teacher: { id: 1, name: 'Dr. Sarah Johnson' },
                    studentCount: 24,
                    deckCount: 5,
                    createdAt: '2024-01-15'
                },
                {
                    id: 2,
                    name: 'Algebra II',
                    subject: 'Mathematics',
                    description: 'Advanced algebra concepts',
                    color: 'blue',
                    classCode: 'MATH202',
                    teacher: { id: 2, name: 'Mr. David Chen' },
                    studentCount: 28,
                    deckCount: 8,
                    createdAt: '2024-01-10'
                },
                {
                    id: 3,
                    name: 'English Literature',
                    subject: 'English',
                    description: 'Classic and contemporary literature',
                    color: 'purple',
                    classCode: 'ENG301',
                    teacher: { id: 3, name: 'Ms. Emma Wilson' },
                    studentCount: 22,
                    deckCount: 6,
                    createdAt: '2024-01-20'
                }
            ])
            setloading(false)
        }, 500)

    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 center">
                <div className="spinner"></div>
            </div>
        )
    }

    return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-custom py-8">
        <h1 className="mb-2">My Classes</h1>
        <p className="text-neutral-600 mb-8">Choose a class to start studying</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map(classData => (
            <ClassCard key={classData.id} classData={classData} />
          ))}
        </div>
      </div>
    </div>
  )
}