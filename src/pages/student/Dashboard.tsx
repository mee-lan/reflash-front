import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import ClassCard from "../../components/ClassCard";
import { RelativeTime } from "../../components";
import type { Class } from "../../types";
import { classAPI } from "../../services/api";
import type { AppDispatch, RootState } from "../../store/store";
import { fetchProgressStats } from "../../store/progressSlice";
import { 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  Brain, 
  Search,
  BookMarked
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function Dashboard() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setloading] = useState(true);
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();
  
  const progressLoaded = useSelector((state: RootState) => state.progress.lastFetched);
  const overallStats = useSelector((state: RootState) => state.progress.overall);
  
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search')?.toLowerCase() || '';

  useEffect(() => {
    if (!progressLoaded) {
      dispatch(fetchProgressStats());
    }
  }, [dispatch, progressLoaded]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setloading(true);
        const data = await classAPI.getAllClasses();
        setClasses(data);
      } catch (error) {
        console.error('Failed to fetch classes:', error);
      } finally {
        setloading(false);
      }
    };

    fetchClasses();
  }, []);

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
    );
  }

  // Data for charts
  const pieData = overallStats ? [
    { name: 'New', value: overallStats.newCards, color: '#3b82f6' },
    { name: 'Learning', value: overallStats.learningCards, color: '#f59e0b' },
    { name: 'Review', value: overallStats.reviewCards, color: '#10b981' }
  ].filter(d => d.value > 0) : [];

  const barData = overallStats ? [
    { name: 'Reps', count: overallStats.totalReps },
    { name: 'Lapses', count: overallStats.totalLapses }
  ] : [];

  return (
    <div className="container-custom py-8">
      {/* Header Section */}
      <div className="mb-8 bg-white p-8 rounded-2xl shadow-sm border border-neutral-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Welcome back, {user?.firstName || 'Student'}
          </h1>
          <p className="text-neutral-600">
            {user?.role === 'STUDENT'
              ? `Grade ${user.grade} • Section ${user.section} • Roll ${user.roll}`
              : 'Choose a class to start studying'}
          </p>
        </div>
        <div className="flex-shrink-0 bg-primary-50 p-4 rounded-full">
          <Brain className="w-12 h-12 text-primary-500" />
        </div>
      </div>

      {/* Progress Overview Section */}
      {overallStats && overallStats.totalCards > 0 && (
        <div className="mb-10 animate-fade-in">
          <h2 className="text-xl font-bold text-neutral-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-500" />
            Your Learning Overview
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card p-5 border-l-4 border-l-primary-500 hover:-translate-y-1 transition-transform duration-300">
              <div className="flex justify-between items-start mb-2">
                <p className="text-neutral-500 text-sm font-medium">Total Cards</p>
                <div className="p-2 bg-primary-50 rounded-lg"><BookOpen className="w-4 h-4 text-primary-500" /></div>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900">{overallStats.totalCards}</h3>
            </div>
            
            <div className="card p-5 border-l-4 border-l-amber-500 hover:-translate-y-1 transition-transform duration-300 relative group">
              <div className="flex justify-between items-start mb-2">
                <p className="text-neutral-500 text-sm font-medium">Due Today</p>
                <div className="p-2 bg-amber-50 rounded-lg"><Calendar className="w-4 h-4 text-amber-500" /></div>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900">{overallStats.dueToday}</h3>
              {overallStats.nextDue !== null && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  Next session: <RelativeTime timestampSeconds={overallStats.nextDue} />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900"></div>
                </div>
              )}
            </div>
            
            <div className="card p-5 border-l-4 border-l-emerald-500 hover:-translate-y-1 transition-transform duration-300">
              <div className="flex justify-between items-start mb-2">
                <p className="text-neutral-500 text-sm font-medium">Average Ease</p>
                <div className="p-2 bg-emerald-50 rounded-lg"><TrendingUp className="w-4 h-4 text-emerald-500" /></div>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900">
                {(overallStats.averageEase / 10).toFixed(1)}%
              </h3>
            </div>

            <div className="card p-5 border-l-4 border-l-blue-500 hover:-translate-y-1 transition-transform duration-300">
              <div className="flex justify-between items-start mb-2">
                <p className="text-neutral-500 text-sm font-medium">New to Learn</p>
                <div className="p-2 bg-blue-50 rounded-lg"><BookMarked className="w-4 h-4 text-blue-500" /></div>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900">{overallStats.newCards}</h3>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart: Cards by Status */}
            {pieData.length > 0 && (
              <div className="card p-5">
                <h3 className="text-base font-semibold text-neutral-800 mb-4 text-center">Cards by Status</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2 text-sm text-neutral-600">
                  {pieData.map(entry => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bar Chart: Reps vs Lapses */}
            {(overallStats.totalReps > 0 || overallStats.totalLapses > 0) && (
              <div className="card p-5">
                <h3 className="text-base font-semibold text-neutral-800 mb-4 text-center">Activity Summary</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        cursor={{ fill: '#f5f5f5' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Classes Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary-500" />
          My Enrolled Classes
        </h2>
        
        {/* If user is searching but from URL rather than input here, we just show indicator */}
        {searchQuery && (
          <div className="flex items-center gap-2 text-sm bg-neutral-100 px-3 py-1.5 rounded-full text-neutral-600">
            <Search className="w-4 h-4" />
            Showing results for "<span className="font-semibold">{searchQuery}</span>"
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.length === 0 ? (
          <div className="col-span-full card">
            <div className="card-body text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                <Search className="w-8 h-8 text-neutral-400" />
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
  );
}