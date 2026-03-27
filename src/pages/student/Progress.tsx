import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "../../store/store"
import { fetchProgressStats } from "../../store/progressSlice"
import { RelativeTime } from "../../components"

export default function Progress() {
  const dispatch = useDispatch<AppDispatch>()
  const { overall: stats, loading, error } = useSelector((state: RootState) => state.progress)

  useEffect(() => {
    // Only fetch if we haven't fetched yet or want to force a refresh. 
    // You could also add a cache expiration check here using `lastFetched`
    if (!stats && !loading) {
      dispatch(fetchProgressStats())
    }
  }, [dispatch, stats, loading])

  if (loading && !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-6">Learning Progress</h1>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center text-red-500">
          {error || "Failed to load progress data."}
        </div>
      </div>
    )
  }

  const easePercentage = Math.min(100, Math.max(0, ((stats.averageEase - 1300) / (2500 - 1300)) * 100))

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-neutral-900">Learning Progress</h1>
        <button 
          onClick={() => dispatch(fetchProgressStats())}
          disabled={loading}
          className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Refresh Stats
        </button>
      </div>
      <p className="text-neutral-500 mb-8">Track your memory retention and spaced repetition statistics.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Cards" 
          value={stats.totalCards} 
          subtitle="Across all decks" 
          color="bg-blue-50 text-blue-700" 
        />
        <StatCard 
          title="Due Today" 
          value={stats.dueToday} 
          subtitle="Cards to review" 
          color="bg-orange-50 text-orange-700" 
          tooltipNode={stats.nextDue !== null ? <>Next session: <RelativeTime timestampSeconds={stats.nextDue} /></> : undefined}
        />
        <StatCard 
          title="Total Reviews" 
          value={stats.totalReps} 
          subtitle="Answers submitted" 
          color="bg-emerald-50 text-emerald-700" 
        />
        <StatCard 
          title="Leeches" 
          value={stats.suspendedCards} 
          subtitle="Suspended cards" 
          color="bg-red-50 text-red-700" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h2 className="text-lg font-bold text-neutral-900 mb-6">Cards by Stage</h2>
          
          <div className="space-y-4">
            <ProgressBar label="New" count={stats.newCards} total={stats.totalCards} color="bg-blue-500" />
            <ProgressBar label="Learning" count={stats.learningCards} total={stats.totalCards} color="bg-orange-500" />
            <ProgressBar label="Review" count={stats.reviewCards} total={stats.totalCards} color="bg-emerald-500" />
            <ProgressBar label="Suspended" count={stats.suspendedCards} total={stats.totalCards} color="bg-red-500" />
          </div>

          <div className="mt-6 pt-6 border-t border-neutral-100">
            <p className="text-sm text-neutral-500 leading-relaxed">
              <strong>New</strong> cards haven't been studied yet. <strong>Learning</strong> cards are currently in short-term memory steps. <strong>Review</strong> cards have graduated and are scheduled based on the algorithm. <strong>Suspended</strong> cards are "leeches" that you've lapsed on many times.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-neutral-900 mb-6">Algorithm Health</h2>
          
          <div className="flex-1 space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-neutral-700">Average Ease Factor</span>
                <span className="text-xl font-bold text-neutral-900">{(stats.averageEase / 1000).toFixed(2)}x</span>
              </div>
              <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-500 rounded-full transition-all duration-1000"
                  style={{ width: `${stats.averageEase === 0 ? 0 : easePercentage}%` }}
                />
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Multiplier applied to intervals on 'Good'. Starts at 2.50x, minimum is 1.30x.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-50 rounded-lg">
                <span className="block text-sm text-neutral-500 mb-1">Total Lapses</span>
                <span className="text-xl font-bold text-neutral-900">{stats.totalLapses}</span>
                <span className="block text-xs text-neutral-400 mt-1">Times forgotten</span>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg">
                <span className="block text-sm text-neutral-500 mb-1">Retention Est.</span>
                <span className="text-xl font-bold text-neutral-900">
                  {stats.totalReps > 0 ? Math.round(((stats.totalReps - stats.totalLapses) / stats.totalReps) * 100) : 0}%
                </span>
                <span className="block text-xs text-neutral-400 mt-1">Recall success rate</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, color, tooltipNode }: { title: string, value: number, subtitle: string, color: string, tooltipNode?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5 flex flex-col relative group">
      <div className={`w-10 h-10 rounded-lg center mb-4 ${color}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
      <span className="text-2xl font-bold text-neutral-900 mb-1">{value.toLocaleString()}</span>
      <span className="text-sm font-medium text-neutral-700">{title}</span>
      <span className="text-xs text-neutral-500 mt-1">{subtitle}</span>

      {tooltipNode && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
          {tooltipNode}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900"></div>
        </div>
      )}
    </div>
  )
}

function ProgressBar({ label, count, total, color }: { label: string, count: number, total: number, color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0
  
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-neutral-700">{label}</span>
        <span className="text-sm text-neutral-500">{count} <span className="text-xs">({percentage.toFixed(1)}%)</span></span>
      </div>
      <div className="h-2.5 w-full bg-neutral-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-1000`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
