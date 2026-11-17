import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PieChart, Bot, Settings, Zap } from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Торговий термінал' },
  { to: '/portfolio', icon: PieChart, label: 'Портфель та гаманець' },
  { to: '/bot', icon: Bot, label: 'Сигнальний бот' },
  { to: '/settings', icon: Settings, label: 'Налаштування API' },
]

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border h-full shrink-0">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-emerald-accent/10 border border-emerald-accent/20 flex items-center justify-center">
          <Zap className="w-5 h-5 text-emerald-accent" />
        </div>
        <div>
          <span className="font-bold text-text-primary text-lg tracking-tight block">VolatiGuard</span>
          <span className="text-[11px] text-emerald-accent uppercase tracking-wider font-semibold">Institutional UI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-emerald-accent/15 text-emerald-accent border border-emerald-accent/20 shadow-sm'
                  : 'text-text-secondary hover:bg-card-hover hover:text-text-primary border border-transparent'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-border bg-bg/30">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Bybit Testnet</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-emerald-accent/10 text-emerald-accent">
            Core 8 + SignalR
          </span>
        </div>
      </div>
    </aside>
  )
}
