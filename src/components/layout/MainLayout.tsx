import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useSignalR } from '../../hooks/useSignalR'
import { useState } from 'react'
import type { BotNotification } from '../../types'
import ToastContainer from '../ui/ToastContainer'

export default function MainLayout() {
  const [toasts, setToasts] = useState<(BotNotification & { id: string })[]>([])

  const { status, latencyMs } = useSignalR({
    onBotNotification: (n) => {
      const id = crypto.randomUUID()
      setToasts(prev => [...prev, { ...n, id }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
    }
  })

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Navbar signalRStatus={status} latencyMs={latencyMs} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  )
}
