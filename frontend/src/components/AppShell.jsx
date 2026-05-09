import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Bot, LayoutDashboard, LogOut, Settings2, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/useAuth'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/ai', label: 'AI Analyst', icon: Bot },
  { to: '/settings', label: 'Settings', icon: Settings2 },
]

export default function AppShell() {
  const { logoutUser } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background text-primary lg:flex">
      <aside className="glass-sidebar flex w-[220px] shrink-0 flex-col px-4 py-5 max-md:w-[60px] max-md:px-2">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(0,212,170,0.18)] bg-[rgba(0,212,170,0.08)] shadow-[0_0_30px_rgba(0,212,170,0.12)]">
            <TrendingUp size={20} className="text-accent" strokeWidth={2.4} />
          </div>
          <div className="max-md:hidden">
            <p className="text-sm font-semibold tracking-[0.22em] text-primary">StockPulse</p>
            <p className="text-xs text-secondary">Premium fintech dashboard</p>
          </div>
        </button>

        <nav className="mt-8 flex flex-1 flex-col gap-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-medium transition-all',
                  isActive
                    ? 'border-[rgba(0,212,170,0.25)] bg-[rgba(0,212,170,0.08)] text-primary shadow-[0_0_24px_rgba(0,212,170,0.08)]'
                    : 'border-transparent text-secondary hover:border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.03)] hover:text-primary',
                ].join(' ')
              }
            >
              <Icon size={18} className="shrink-0 text-accent" />
              <span className="max-md:hidden">{label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => {
            logoutUser()
            navigate('/login')
          }}
          className="mt-auto flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm font-medium text-secondary transition-all hover:border-[rgba(255,77,77,0.2)] hover:bg-[rgba(255,77,77,0.08)] hover:text-loss"
        >
          <LogOut size={18} className="shrink-0" />
          <span className="max-md:hidden">Logout</span>
        </button>
      </aside>

      <main className="flex-1 overflow-hidden">
        <div className="page-transition min-h-screen p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}