export default function TeacherInsights() {
  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="mb-2">Class Insights</h1>
          <p className="text-neutral-600">
            Analyze your classes' performance and identify areas for improvement
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="card-body h-64 flex flex-col items-center justify-center text-center">
             <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-50 rounded-full mb-4">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-neutral-900 mb-1">Performance Analytics</h3>
            <p className="text-sm text-neutral-500">Coming soon</p>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body h-64 flex flex-col items-center justify-center text-center">
             <div className="inline-flex items-center justify-center w-12 h-12 bg-green-50 rounded-full mb-4">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="font-semibold text-neutral-900 mb-1">Study Trends</h3>
            <p className="text-sm text-neutral-500">Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  )
}
