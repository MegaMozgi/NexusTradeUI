import { useState, useCallback } from 'react'
import { useSignalR } from '../hooks/useSignalR'
import type { PriceUpdate, VolatilityData, TradingSession } from '../types'
import LiveChart from '../components/dashboard/LiveChart'
import VolatilityWidget from '../components/dashboard/VolatilityWidget'
import TradePanel from '../components/dashboard/TradePanel'
import { Activity, RefreshCw } from 'lucide-react'

const AVAILABLE_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT']

export default function DashboardPage() {
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [latestPrice, setLatestPrice] = useState<PriceUpdate | null>(null)
  const [volatility, setVolatility] = useState<VolatilityData | null>(null)
  const [activeSession, setActiveSession] = useState<TradingSession | null>(null)

  const { status, reconnect } = useSignalR({
    onPriceUpdate: useCallback((d: PriceUpdate) => {
      if (d.symbol === symbol) {
        setLatestPrice(d)
      }
    }, [symbol]),
    onVolatilityData: useCallback((d: VolatilityData) => {
      if (d.symbol === symbol) {
        setVolatility(d)
      }
    }, [symbol]),
  })

  return (
    <div className="space-y-4">
      {/* Top Header & Symbol Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-accent/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-emerald-accent" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary">Торговий термінал</h1>
            <p className="text-xs text-text-secondary">Аналіз волатильності та динамічний захист депозиту</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Symbol Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted">Інструмент:</label>
            <select
              value={symbol}
              onChange={e => {
                setSymbol(e.target.value)
                setLatestPrice(null)
                setVolatility(null)
              }}
              className="input w-auto text-sm font-bold font-mono py-1.5 px-3 bg-bg border-border text-emerald-accent"
            >
              {AVAILABLE_SYMBOLS.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Connection status tag */}
          <div className="flex items-center gap-2 bg-bg px-3 py-1.5 rounded-lg border border-border text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'connected'
                  ? 'bg-emerald-accent pulse-active'
                  : status === 'connecting'
                  ? 'bg-yellow-400 animate-spin'
                  : 'bg-crimson-accent'
              }`}
            />
            <span className="text-text-secondary font-medium">
              {status === 'connected'
                ? 'Живий потік SignalR'
                : status === 'connecting'
                ? 'Підключення…'
                : 'Немає зв’язку'}
            </span>
            {status === 'disconnected' && (
              <button
                onClick={reconnect}
                className="text-emerald-accent hover:underline ml-1 text-[11px]"
                title="Спробувати підключитися знову"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Terminal Grid: Chart + Volatility Widget on Left, Trade Panel on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Left Column (Chart & Volatility Widget, 3 cols) */}
        <div className="xl:col-span-3 space-y-4">
          <LiveChart symbol={symbol} latestPrice={latestPrice} volatility={volatility} />
          <VolatilityWidget volatility={volatility} currentPrice={latestPrice?.price ?? null} />
        </div>

        {/* Right Column (Quick Trade & Session Panel, 2 cols) */}
        <div className="xl:col-span-2">
          <TradePanel
            symbol={symbol}
            currentPrice={latestPrice?.price ?? null}
            activeSession={activeSession}
            onSessionChange={setActiveSession}
          />
        </div>
      </div>
    </div>
  )
}
