import { Link, useLocation } from 'react-router-dom'
import { Music2, Settings, LayoutDashboard } from 'lucide-react'
import { clsx } from 'clsx'

export function TopNav() {
  const location = useLocation()

  return (
    <header className="h-12 bg-surface-raised border-b border-white/5 flex items-center px-4 shrink-0 z-50">
      <Link to="/dashboard" className="flex items-center gap-2 mr-8">
        <Music2 size={20} className="text-accent" />
        <span className="font-bold text-white tracking-wide">SonicForge</span>
      </Link>

      <nav className="flex items-center gap-1 flex-1">
        <NavLink to="/dashboard" icon={<LayoutDashboard size={15} />} label="Projects" />
      </nav>

      <div className="flex items-center gap-2">
        <Link
          to="/settings"
          className={clsx(
            'p-2 rounded-lg transition-colors',
            location.pathname === '/settings'
              ? 'bg-accent/20 text-accent'
              : 'text-gray-400 hover:text-white hover:bg-white/5',
          )}
        >
          <Settings size={16} />
        </Link>
      </div>
    </header>
  )
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const location = useLocation()
  const active = location.pathname.startsWith(to)

  return (
    <Link
      to={to}
      className={clsx(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
        active ? 'bg-accent/20 text-accent' : 'text-gray-400 hover:text-white hover:bg-white/5',
      )}
    >
      {icon}
      {label}
    </Link>
  )
}
