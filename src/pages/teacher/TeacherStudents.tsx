export default function TeacherStudents() {
  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="mb-2">My Students</h1>
          <p className="text-neutral-600">
            View and manage all students enrolled in your classes
          </p>
        </div>
      </div>
      
      <div className="card">
        <div className="card-body text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">Student Directory Coming Soon</h3>
          <p className="text-neutral-500 max-w-md mx-auto">
            This page will allow you to see all your students, their overall performance, and individually message them or view their detailed progress.
          </p>
        </div>
      </div>
    </div>
  )
}
