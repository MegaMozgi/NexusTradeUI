import { useState, useEffect, useCallback } from 'react'
import { Bot, RefreshCw, Loader2, AlertCircle, TrendingUp, TrendingDown, Minus, Activity, ShieldCheck, Power } from 'lucide-react'
import api from '../lib/axios'
import type { BotLog } from '../types'
import clsx from 'clsx'

export default function BotPage() {
  const [botActive, setBotActive] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [logs, setLogs] = useState<BotLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  // Safe mapping of bot logs from ASP.NET Core response
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true)
    setError('')
    try {
      const response = await api.get('/Bot/logs')
      const data = response.data

      // Extract array safely whether direct array or wrapped
      let rawList: unknown[] = []
      if (Array.isArray(data)) {
        rawList = data
      } else if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>
        if (Array.isArray(obj.logs)) rawList = obj.logs
        else if (Array.isArray(obj.Logs)) rawList = obj.Logs
        else if (Array.isArray(obj.data)) rawList = obj.data
        else if (Array.isArray(obj.items)) rawList = obj.items
      }

      // Normalize each log item to handle camelCase / PascalCase
      const mappedLogs: BotLog[] = rawList.map((item: any, idx: number) => {
        const rawAction = String(item.action ?? item.Action ?? 'HOLD').toUpperCase()
        const action: BotLog['action'] = rawAction === 'BUY' ? 'BUY' : rawAction === 'SELL' ? 'SELL' : 'HOLD'

        const rawStatus = String(item.status ?? item.Status ?? 'EXECUTED').toUpperCase()
        const status: BotLog['status'] =
          rawStatus === 'EXECUTED' ? 'EXECUTED' : rawStatus === 'FAILED' ? 'FAILED' : 'PENDING'

        return {
          id: String(item.id ?? item.Id ?? item.logId ?? item.LogId ?? `log-${idx}-${Date.now()}`),
          timestamp: String(item.timestamp ?? item.Timestamp ?? item.createdAt ?? item.CreatedAt ?? new Date().toISOString()),
          symbol: String(item.symbol ?? item.Symbol ?? 'BTCUSDT'),
          action,
          executionPrice: Number(item.executionPrice ?? item.ExecutionPrice ?? item.price ?? item.Price ?? 0),
          atr: Number(item.atr ?? item.Atr ?? item.ATR ?? 0),
          adaptiveSLPercent: Number(
            item.adaptiveSLPercent ??
            item.adaptiveSlPercent ??
            item.AdaptiveSLPercent ??
            item.AdaptiveSlPercent ??
            item.adaptiveSL ??
            item.AdaptiveSL ??
            0
          ),
          status,
        }
      })

      // Sort by timestamp descending
      mappedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setLogs(mappedLogs)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Не вдалося завантажити журнал сигналів бота')
    } finally {
      setLogsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Master Toggle switch handler (POST /api/Bot/toggle)
  const toggleBot = async () => {
    setToggling(true)
    setError('')
    setStatusMessage('')
    try {
      const response = await api.post('/Bot/toggle')
      const data = response.data

      let isActive = false
      let msg = ''

      if (typeof data === 'boolean') {
        isActive = data
      } else if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>
        isActive = Boolean(
          obj.isActive ??
          obj.IsActive ??
          obj.isRunning ??
          obj.IsRunning ??
          obj.enabled ??
          obj.Enabled ??
          obj.state
        )
        msg = (obj.message ?? obj.Message) as string ?? ''
      }

      setBotActive(isActive)
      setStatusMessage(
        msg ||
          (isActive
            ? 'Сигнальний бот успішно запущений. Працює алгоритм адаптивного відстеження волатильності.'
            : 'Сигнальний бот деактивований.')
      )
      setTimeout(() => setStatusMessage(''), 5000)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Помилка зміни стану сигнального бота')
    } finally {
      setToggling(false)
    }
  }

  const ActionBadge = ({ action }: { action: BotLog['action'] }) => {
    if (action === 'BUY') {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-xs px-2.5 py-1 rounded-md bg-emerald-accent/15 text-emerald-accent border border-emerald-accent/30">
          <TrendingUp className="w-3.5 h-3.5" />
          КУПІВЛЯ (BUY)
        </span>
      )
    }
    if (action === 'SELL') {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-xs px-2.5 py-1 rounded-md bg-crimson-accent/15 text-crimson-accent border border-crimson-accent/30">
          <TrendingDown className="w-3.5 h-3.5" />
          ПРОДАЖ (SELL)
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 font-medium text-xs px-2 py-0.5 rounded bg-border text-text-muted">
        <Minus className="w-3 h-3" />
        {action}
      </span>
    )
  }

  const StatusBadge = ({ status }: { status: BotLog['status'] }) => {
    if (status === 'EXECUTED') {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-accent/15 text-emerald-accent">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-accent" />
          ВИКОНАНО
        </span>
      )
    }
    if (status === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-crimson-accent/15 text-crimson-accent">
          <span className="w-1.5 h-1.5 rounded-full bg-crimson-accent" />
          ПОМИЛКА
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-yellow-400/15 text-yellow-400">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
        В ОБРОБЦІ
      </span>
    )
  }

  const executedCount = logs.filter(l => l.status === 'EXECUTED').length
  const failedCount = logs.filter(l => l.status === 'FAILED').length

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">Автоматизований сигнальний бот</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Автоматичне генерування сигналів та ордерів на основі адаптивного аналізу волатильності
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-crimson-accent/10 border border-crimson-accent/25 rounded-xl px-4 py-3 text-sm text-crimson-accent">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {statusMessage && (
        <div className="flex items-center gap-3 bg-emerald-accent/10 border border-emerald-accent/25 rounded-xl px-4 py-3 text-sm text-emerald-accent">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Prominent Master Toggle Card */}
      <div className="card border border-border bg-gradient-to-br from-card to-card-hover p-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Visual Icon with animated pulse when active */}
            <div
              className={clsx(
                'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 relative',
                botActive
                  ? 'bg-emerald-accent/15 border-2 border-emerald-accent text-emerald-accent pulse-active shadow-lg shadow-emerald-accent/20'
                  : 'bg-bg border-2 border-border text-text-muted'
              )}
            >
              <Bot className="w-8 h-8" />
            </div>

            <div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-text-primary">Головний модуль автоторгівлі</span>
                <span
                  className={clsx(
                    'text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider',
                    botActive
                      ? 'bg-emerald-accent/15 text-emerald-accent border border-emerald-accent/30'
                      : 'bg-bg text-text-muted border border-border'
                  )}
                >
                  {botActive ? '● АКТИВНИЙ' : '○ ЗУПИНЕНИЙ'}
                </span>
              </div>
              <p className="text-sm text-text-secondary mt-1 max-w-xl">
                {botActive
                  ? 'Бот аналізує котирування в реальному часі через SignalR, відстежує ATR-тригери та автоматично надсилає ринкові ордери з адаптивним стоп-лосом.'
                  : 'Бот вимкнений. Перемкніть перемикач праворуч для активації автоматичного виконання торгових сигналів.'}
              </p>
            </div>
          </div>

          {/* Master Toggle Control Switch */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-text-secondary">
              {botActive ? 'Вимкнути' : 'Увімкнути'}
            </span>
            <button
              onClick={toggleBot}
              disabled={toggling}
              className={clsx(
                'relative w-16 h-8 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-accent disabled:opacity-50',
                botActive ? 'bg-emerald-accent shadow-lg shadow-emerald-accent/25' : 'bg-border'
              )}
              aria-label="Перемикач бота"
            >
              <span
                className={clsx(
                  'absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-200',
                  botActive && 'translate-x-8'
                )}
              >
                {toggling ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-bg" />
                ) : (
                  <Power className={clsx('w-3.5 h-3.5', botActive ? 'text-emerald-accent' : 'text-text-muted')} />
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-border/60">
          <div className="bg-bg/60 rounded-xl p-3 text-center border border-border/40">
            <div className="text-2xl font-bold font-mono text-text-primary">{logs.length}</div>
            <div className="text-xs text-text-muted mt-0.5">Всього сигналів</div>
          </div>
          <div className="bg-bg/60 rounded-xl p-3 text-center border border-border/40">
            <div className="text-2xl font-bold font-mono text-emerald-accent">{executedCount}</div>
            <div className="text-xs text-text-muted mt-0.5">Успішно виконано</div>
          </div>
          <div className="bg-bg/60 rounded-xl p-3 text-center border border-border/40">
            <div className="text-2xl font-bold font-mono text-crimson-accent">{failedCount}</div>
            <div className="text-xs text-text-muted mt-0.5">Помилки або відхилено</div>
          </div>
        </div>
      </div>

      {/* Bot Activity & Signals Table */}
      <div className="card border border-border p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-border bg-card/60">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-accent" />
            <h2 className="text-sm font-semibold text-text-primary">
              Журнал активності та сигналів бота
            </h2>
          </div>
          <button
            onClick={fetchLogs}
            disabled={logsLoading}
            className="btn-ghost text-xs flex items-center gap-1.5 py-1.5 px-3"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', logsLoading && 'animate-spin text-emerald-accent')} />
            <span>Оновити журнал</span>
          </button>
        </div>

        {logsLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-bg rounded-lg animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-text-muted text-sm">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-25" />
            <p className="font-medium text-text-secondary">Історія сигналів порожня</p>
            <p className="text-xs text-text-muted mt-1">
              Коли бот зафіксує торгові патерни або виконає ордери, вони з'являться тут у реальному часі.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg/40 text-text-muted text-xs text-left">
                  <th className="px-4 py-3 font-medium">Час події</th>
                  <th className="px-4 py-3 font-medium">Торгова пара</th>
                  <th className="px-4 py-3 font-medium">Дія</th>
                  <th className="px-4 py-3 font-medium text-right">Ціна виконання</th>
                  <th className="px-4 py-3 font-medium text-right">Розрахований ATR</th>
                  <th className="px-4 py-3 font-medium text-right">Адаптивний SL %</th>
                  <th className="px-4 py-3 font-medium text-center">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono text-xs">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-card-hover transition-colors">
                    <td className="px-4 py-3.5 text-text-muted whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('uk-UA')}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-text-primary">
                      {log.symbol}
                    </td>
                    <td className="px-4 py-3.5">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-text-primary">
                      ${log.executionPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5 text-right text-blue-accent font-semibold">
                      {log.atr.toFixed(4)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-crimson-accent font-semibold">
                      -{log.adaptiveSLPercent.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge status={log.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
