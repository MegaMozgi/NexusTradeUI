import { useState, useEffect, useCallback } from 'react'
import { Play, Square, Zap, TrendingUp, TrendingDown, Loader2, AlertCircle, CheckCircle2, ShieldCheck, Target } from 'lucide-react'
import api from '../../lib/axios'
import type { TradingSession, MarketOrderRequest } from '../../types'
import clsx from 'clsx'

interface Props {
  symbol: string
  currentPrice: number | null
  activeSession: TradingSession | null
  onSessionChange: (s: TradingSession | null) => void
}

type Side = 'Buy' | 'Sell'

export default function TradePanel({ symbol, currentPrice, activeSession, onSessionChange }: Props) {
  const [qty, setQty] = useState('')
  const [side, setSide] = useState<Side>('Buy')
  const [loading, setLoading] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [sessionFetchLoading, setSessionFetchLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Helper to extract session ID safely (supports id, sessionId, Id, SessionId)
  const getSessionId = (session: TradingSession | null): string | undefined => {
    if (!session) return undefined
    const raw = session as unknown as Record<string, unknown>
    return (
      session.id ??
      session.sessionId ??
      (raw.Id as string | undefined) ??
      (raw.SessionId as string | undefined)
    )
  }

  // Load existing active session for this symbol
  // Handles 404 Not Found gracefully without throwing console errors
  const fetchSession = useCallback(async () => {
    setSessionFetchLoading(true)
    try {
      const response = await api.get<TradingSession>(`/Trading/sessions/${symbol}`, {
        validateStatus: status => (status >= 200 && status < 300) || status === 404,
      })

      if (response.status === 404 || !response.data) {
        onSessionChange(null)
      } else {
        const raw = response.data as unknown as Record<string, unknown>
        // Ensure properties exist
        const mappedSession: TradingSession = {
          id: (response.data.id ?? response.data.sessionId ?? raw.Id ?? raw.SessionId) as string | undefined,
          sessionId: (response.data.sessionId ?? response.data.id ?? raw.SessionId ?? raw.Id) as string | undefined,
          symbol: (response.data.symbol ?? raw.Symbol ?? symbol) as string,
          entryPrice: Number(response.data.entryPrice ?? raw.EntryPrice ?? 0),
          stopLoss: response.data.stopLoss ?? (raw.StopLoss as number | undefined),
          stopLossPrice: response.data.stopLossPrice ?? (raw.StopLossPrice as number | undefined),
          currentPrice: Number(response.data.currentPrice ?? raw.CurrentPrice ?? 0),
          pnl: Number(response.data.pnl ?? raw.Pnl ?? raw.PnL ?? 0),
          status: (response.data.status ?? raw.Status ?? 'ACTIVE') as string,
          createdAt: (response.data.createdAt ?? raw.CreatedAt) as string | undefined,
        }
        onSessionChange(mappedSession)
      }
    } catch {
      // Any other network issue -> reset to null
      onSessionChange(null)
    } finally {
      setSessionFetchLoading(false)
    }
  }, [symbol, onSessionChange])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  // Start new tracking session
  const startSession = async () => {
    setSessionLoading(true)
    setError('')
    setSuccess('')
    try {
      const { data } = await api.post<TradingSession>('/Trading/sessions', { symbol })
      const raw = data as unknown as Record<string, unknown>
      const mappedSession: TradingSession = {
        id: (data.id ?? data.sessionId ?? raw.Id ?? raw.SessionId) as string | undefined,
        sessionId: (data.sessionId ?? data.id ?? raw.SessionId ?? raw.Id) as string | undefined,
        symbol: (data.symbol ?? raw.Symbol ?? symbol) as string,
        entryPrice: Number(data.entryPrice ?? raw.EntryPrice ?? currentPrice ?? 0),
        stopLoss: data.stopLoss ?? (raw.StopLoss as number | undefined),
        stopLossPrice: data.stopLossPrice ?? (raw.StopLossPrice as number | undefined),
        currentPrice: Number(data.currentPrice ?? raw.CurrentPrice ?? currentPrice ?? 0),
        pnl: Number(data.pnl ?? raw.Pnl ?? raw.PnL ?? 0),
        status: (data.status ?? raw.Status ?? 'ACTIVE') as string,
        createdAt: (data.createdAt ?? raw.CreatedAt) as string | undefined,
      }
      onSessionChange(mappedSession)
      setSuccess(`Сесію відстеження для ${mappedSession.symbol} успішно запущено`)
      setTimeout(() => setSuccess(''), 4000)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Не вдалося створити торгову сесію')
    } finally {
      setSessionLoading(false)
    }
  }

  // Stop active session (safely extracts session.id ?? session.sessionId)
  const stopSession = async () => {
    if (!activeSession) return

    const sessionId = getSessionId(activeSession)
    if (!sessionId) {
      setError('Помилка: не вдалося знайти ідентифікатор сесії (Session ID is undefined)')
      return
    }

    setSessionLoading(true)
    setError('')
    setSuccess('')
    try {
      await api.delete(`/Trading/sessions/${sessionId}`)
      onSessionChange(null)
      setSuccess(`Сесію ${symbol} успішно завершено`)
      setTimeout(() => setSuccess(''), 4000)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Не вдалося зупинити торгову сесію')
    } finally {
      setSessionLoading(false)
    }
  }

  // Place market order
  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericQty = parseFloat(qty)
    if (isNaN(numericQty) || numericQty <= 0) {
      setError('Введіть коректну кількість для ордера')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    const payload: MarketOrderRequest = {
      symbol,
      side,
      qty: numericQty,
    }

    try {
      await api.post('/Trading/orders/market', payload)
      setSuccess(
        `Ринковий ордер ${side === 'Buy' ? 'КУПІВЛІ' : 'ПРОДАЖУ'} ${numericQty} ${symbol} успішно виконано`
      )
      setQty('')
      setTimeout(() => setSuccess(''), 4500)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Помилка виконання ордера на біржі')
    } finally {
      setLoading(false)
    }
  }

  const estTotal = currentPrice && qty && !isNaN(parseFloat(qty)) ? parseFloat(qty) * currentPrice : 0

  // Safe mapping of session values
  const sessionSymbol = activeSession?.symbol ?? symbol
  const sessionEntryPrice = Number(activeSession?.entryPrice ?? 0)
  const sessionStopLoss = activeSession?.stopLoss ?? activeSession?.stopLossPrice
  const pnl = Number(activeSession?.pnl ?? 0)
  const isPnlPositive = pnl >= 0

  return (
    <div className="space-y-4">
      {/* Alert / Notification box */}
      {error && (
        <div className="flex items-start gap-2.5 bg-crimson-accent/10 border border-crimson-accent/25 rounded-xl p-3 text-xs text-crimson-accent">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2.5 bg-emerald-accent/10 border border-emerald-accent/25 rounded-xl p-3 text-xs text-emerald-accent">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{success}</span>
        </div>
      )}

      {/* 1. Tracking Session Card */}
      <div className="card border border-border">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-accent" />
            Відстеження позиції
          </h2>
          {activeSession && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-accent/15 text-emerald-accent border border-emerald-accent/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-accent animate-ping" />
              АКТИВНА
            </span>
          )}
        </div>

        {sessionFetchLoading ? (
          <div className="space-y-2 py-3 animate-pulse">
            <div className="h-4 bg-bg rounded w-3/4" />
            <div className="h-4 bg-bg rounded w-1/2" />
          </div>
        ) : activeSession ? (
          <div className="space-y-3">
            <div className="bg-bg/80 rounded-xl p-3.5 space-y-2 border border-border/60">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Торговий інструмент:</span>
                <span className="font-semibold text-text-primary font-mono">{sessionSymbol}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Ціна входу (Entry):</span>
                <span className="font-mono font-medium text-text-primary">
                  ${sessionEntryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary flex items-center gap-1">
                  <Target className="w-3 h-3 text-crimson-accent" />
                  Рівень Stop-Loss:
                </span>
                <span className="font-mono font-bold text-crimson-accent">
                  {sessionStopLoss != null
                    ? `$${Number(sessionStopLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : 'Динамічний (SignalR)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Поточна ринкова ціна:</span>
                <span className="font-mono font-medium text-text-primary">
                  {currentPrice ? `$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-border/40 pt-2">
                <span className="text-text-secondary">Нереалізований PnL:</span>
                <span className={clsx('font-mono font-bold text-sm', isPnlPositive ? 'text-emerald-accent' : 'text-crimson-accent')}>
                  {isPnlPositive ? '+' : ''}
                  {pnl.toFixed(2)} USDT
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted">Статус сесії:</span>
                <span className="text-emerald-accent font-medium">{activeSession.status || 'ACTIVE'}</span>
              </div>
            </div>

            <button
              onClick={stopSession}
              disabled={sessionLoading}
              className="btn-danger w-full flex items-center justify-center gap-2 py-2.5 text-sm"
            >
              {sessionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
              {sessionLoading ? 'Зупинка сесії…' : 'Зупинити сесію та фіксувати'}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xs text-text-secondary mb-3 leading-relaxed">
              Немає активної сесії для <span className="text-text-primary font-semibold">{symbol}</span>. Запустіть сесію для моніторингу адаптивного стоп-лосу та автоматичного супроводу ризику.
            </p>
            <button
              onClick={startSession}
              disabled={sessionLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm"
            >
              {sessionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {sessionLoading ? 'Запуск сесії…' : 'Почати нову сесію'}
            </button>
          </div>
        )}
      </div>

      {/* 2. Quick Trade Order Card */}
      <div className="card border border-border">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-accent" />
            Швидка торгівля (Market Order)
          </h2>
          <span className="text-[11px] text-text-muted font-mono bg-bg px-2 py-0.5 rounded border border-border">
            Testnet
          </span>
        </div>

        {/* Buy / Sell Selector Tab */}
        <div className="grid grid-cols-2 rounded-xl bg-bg p-1 border border-border mb-4">
          <button
            type="button"
            onClick={() => setSide('Buy')}
            className={clsx(
              'flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all',
              side === 'Buy'
                ? 'bg-emerald-accent text-bg shadow-md'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            КУПІВЛЯ (BUY)
          </button>
          <button
            type="button"
            onClick={() => setSide('Sell')}
            className={clsx(
              'flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all',
              side === 'Sell'
                ? 'bg-crimson-accent text-white shadow-md'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            ПРОДАЖ (SELL)
          </button>
        </div>

        <form onSubmit={placeOrder} className="space-y-3.5">
          <div>
            <div className="flex justify-between items-center text-xs text-text-secondary mb-1.5">
              <span>Кількість активу</span>
              <span className="text-text-muted font-mono">{symbol.replace('USDT', '')}</span>
            </div>
            <input
              type="number"
              step="any"
              min="0.0001"
              required
              className="input font-mono text-sm"
              placeholder="0.01"
              value={qty}
              onChange={e => setQty(e.target.value)}
            />
          </div>

          {/* Quick preset buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {['0.001', '0.01', '0.05', '0.1'].map(preset => (
              <button
                type="button"
                key={preset}
                onClick={() => setQty(preset)}
                className="py-1 text-[11px] font-mono bg-bg/60 border border-border rounded hover:border-emerald-accent/50 text-text-secondary hover:text-text-primary transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Order calculation preview */}
          <div className="bg-bg/60 rounded-xl p-3 border border-border/50 text-xs space-y-1.5">
            <div className="flex justify-between text-text-secondary">
              <span>Тип ордера:</span>
              <span className="font-semibold text-text-primary">Ринковий (Market)</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Орієнтовна вартість:</span>
              <span className="font-mono font-semibold text-text-primary">
                ${estTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !qty || parseFloat(qty) <= 0}
            className={clsx(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all duration-150',
              side === 'Buy' ? 'btn-primary' : 'btn-danger'
            )}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading
              ? 'Надсилання ордера…'
              : side === 'Buy'
              ? `Купити ${symbol.replace('USDT', '')}`
              : `Продати ${symbol.replace('USDT', '')}`}
          </button>
        </form>
      </div>
    </div>
  )
}
