import { useLocation,Link } from "react-router-dom"
import { useSelector } from "react-redux"
import type { RootState } from "../store/store"

export default function Sidebar(){
    const location = useLocation()
    const user = useSelector((state: RootState) => state.auth.user)
    const dashboardPath = user?.role === 'TEACHER'
      ? '/teacher/dashboard'
      : user?.role === 'ADMINISTRATOR'
        ? '/admin/dashboard'
        : '/dashboard'
    
    const isActive = (item: { to: string, label: string }) => {
        if (item.label === 'Dashboard') {
            return location.pathname === item.to
        }
        if (item.label === 'My Classes') {
            const classPrefix = user?.role === 'TEACHER' ? '/teacher/class' : '/class'
            const deckPrefix = user?.role === 'TEACHER' ? '/teacher/deck' : '/study'
            return location.pathname.startsWith(classPrefix) || location.pathname.startsWith(deckPrefix)
        }
        return location.pathname === item.to || location.pathname.startsWith(item.to + '/')
    }

    const navigationItems = user?.role === 'ADMINISTRATOR'
      ? [
          { to: '/admin/dashboard', label: 'Dashboard', icon: 'home' },
          { to: '/admin/courses/create', label: 'Create Course', icon: 'book' },
          { to: '/admin/courses/edit', label: 'Edit Course', icon: 'pencil' },
          { to: '/admin/students/create', label: 'New Student', icon: 'users' },
          { to: '/admin/teachers/create', label: 'New Teacher', icon: 'user-plus' },
        ]
      : [
          { to: dashboardPath, label: 'Dashboard', icon: 'home' },
          { to: dashboardPath, label: 'My Classes', icon: 'book' },
          { to: '/progress', label: 'Progress', icon: 'chart' },
        ]

    const renderIcon = (icon: string) => {
      if (icon === 'home') {
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )
      }

      if (icon === 'book') {
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )
      }

      if (icon === 'pencil') {
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.586 2.586a2 2 0 112.828 2.828L12 14.828 8 16l1.172-4 9.414-9.414z" />
          </svg>
        )
      }

      if (icon === 'users') {
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-1a4 4 0 00-5.356-3.77M9 20H4v-1a4 4 0 015.356-3.77M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )
      }

      if (icon === 'user-plus') {
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v6m3-3h-6M5.121 17.804A9 9 0 1118.88 6.197M15 21H3v-1a6 6 0 0112 0v1z" />
          </svg>
        )
      }

      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }

    
  return (
    <aside className="w-64 bg-white border-r border-neutral-200 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-xl center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="font-bold text-xl text-neutral-900">Re-Flash</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.to + item.label}>
              <Link
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item)
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {renderIcon(item.icon)}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-200">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </Link>
      </div>
    </aside>
  )
}
