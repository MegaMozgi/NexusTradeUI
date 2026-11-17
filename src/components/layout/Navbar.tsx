import { LogOut, WifiOff, Loader2, Zap } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface Props {
  signalRStatus: 'connecting' | 'connected' | 'disconnected'
  latencyMs: number | null
}

export default function Navbar({ signalRStatus, latencyMs }: Props) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0 z-10">
      {/* Mobile brand & Connection status */}
      <div className="flex items-center gap-4">
        {/* Mobile brand logo */}
        <div className="flex md:hidden items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-accent/10 border border-emerald-accent/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-emerald-accent" />
          </div>
          <span className="font-bold text-text-primary text-base">VolatiGuard</span>
        </div>

        {/* Live SignalR Connection status indicator */}
        <div className="flex items-center gap-2">
          {signalRStatus === 'connected' && (
            <div className="flex items-center gap-2 bg-emerald-accent/10 border border-emerald-accent/20 px-2.5 py-1 rounded-full text-xs font-medium text-emerald-accent">
              <span className="w-2 h-2 rounded-full bg-emerald-accent pulse-active" />
              <span>В мережі</span>
              {latencyMs != null && (
                <span className="text-text-muted border-l border-emerald-accent/30 pl-1.5 ml-0.5">
                  {latencyMs} мс
                </span>
              )}
            </div>
          )}
          {signalRStatus === 'connecting' && (
            <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 px-2.5 py-1 rounded-full text-xs font-medium text-yellow-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>З'єднання…</span>
            </div>
          )}
          {signalRStatus === 'disconnected' && (
            <div className="flex items-center gap-2 bg-crimson-accent/10 border border-crimson-accent/20 px-2.5 py-1 rounded-full text-xs font-medium text-crimson-accent">
              <WifiOff className="w-3 h-3" />
              <span>Відключено</span>
            </div>
          )}
        </div>
      </div>

      {/* User profile & Logout */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-text-secondary">
            <span className="w-2 h-2 rounded-full bg-border" />
            <span className="font-medium text-text-primary">{user.username || user.email}</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-crimson-accent transition-colors px-2 py-1 rounded-lg hover:bg-card-hover"
          title="Вийти з облікового запису"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Вийти</span>
        </button>
      </div>
    </header>
  )
}
