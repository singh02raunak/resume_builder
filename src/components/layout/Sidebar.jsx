import { NavLink } from 'react-router-dom'
import { FileText, Mail, LayoutDashboard, Settings, Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/resume/new', icon: FileText, label: 'New Resume' },
  { to: '/cover-letter/new', icon: Mail, label: 'New Cover Letter' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2 font-bold text-indigo-600 text-lg">
          <Sparkles className="w-5 h-5" />
          ResumeAI
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 m-4 bg-indigo-50 rounded-xl">
        <p className="text-xs font-semibold text-indigo-700 mb-1">Free Plan</p>
        <p className="text-xs text-indigo-600 mb-3">1/1 resumes used</p>
        <a
          href="/pricing"
          className="block text-center text-xs font-medium bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Upgrade to Pro
        </a>
      </div>
    </aside>
  )
}
