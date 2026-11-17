import clsx from 'clsx'
import type { BotNotification } from '../../types'
import { X, TrendingUp, TrendingDown, AlertCircle, Info } from 'lucide-react'

const ICONS = {
  BUY: <TrendingUp className="w-4 h-4 text-emerald-accent" />,
  SELL: <TrendingDown className="w-4 h-4 text-crimson-accent" />,
  WARNING: <AlertCircle className="w-4 h-4 text-yellow-400" />,
  ERROR: <AlertCircle className="w-4 h-4 text-crimson-accent" />,
  INFO: <Info className="w-4 h-4 text-blue-accent" />,
}

const TYPE_LABELS: Record<string, string> = {
  BUY: 'СИГНАЛ: КУПІВЛЯ (BUY)',
  SELL: 'СИГНАЛ: ПРОДАЖ (SELL)',
  WARNING: 'ПОПЕРЕДЖЕННЯ',
  ERROR: 'ПОМИЛКА',
  INFO: 'СПОВІЩЕННЯ БОТА',
}

interface Props {
  toasts: (BotNotification & { id: string })[]
  onDismiss: (id: string) => void
}

export default function ToastContainer({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 w-88 max-w-[calc(100vw-2rem)]">
      {toasts.map(t => (
        <div
          key={t.id}
          className={clsx(
            'toast-enter card flex items-start gap-3 shadow-2xl border backdrop-blur-md bg-card/95 p-3.5',
            t.type === 'BUY'
              ? 'border-emerald-accent/40 bg-emerald-accent/5'
              : t.type === 'SELL' || t.type === 'ERROR'
              ? 'border-crimson-accent/40 bg-crimson-accent/5'
              : 'border-border'
          )}
        >
          <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-bg/60 border border-border">
            {ICONS[t.type] || <Info className="w-4 h-4 text-text-muted" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold tracking-wider text-text-primary">
                {TYPE_LABELS[t.type] || t.type}
              </span>
              {t.symbol && (
                <span className="text-xs font-bold text-emerald-accent bg-emerald-accent/10 px-1.5 py-0.5 rounded">
                  {t.symbol}
                </span>
              )}
            </div>
            <div className="text-xs text-text-secondary mt-1 leading-relaxed">
              {t.message}
            </div>
            {t.price != null && (
              <div className="text-[11px] text-text-muted mt-1">
                Ціна: <span className="text-text-primary font-medium">${t.price.toLocaleString()}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="shrink-0 text-text-muted hover:text-text-secondary transition-colors p-1"
            title="Закрити"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
