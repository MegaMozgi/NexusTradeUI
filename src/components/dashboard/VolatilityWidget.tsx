import { Activity, ShieldAlert, Waves, Percent, Target } from 'lucide-react'
import type { VolatilityData } from '../../types'
import clsx from 'clsx'

interface Props {
  volatility: VolatilityData | null
  currentPrice: number | null
}

export default function VolatilityWidget({ volatility, currentPrice }: Props) {
  const isVolatile = volatility?.marketState === 'HIGH_VOLATILITY'

  return (
    <div className="card border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-accent" />
          <h2 className="text-base font-semibold text-text-primary">
            Діагностика волатильності
          </h2>
        </div>

        {volatility ? (
          <span
            className={clsx(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide',
              isVolatile
                ? 'bg-crimson-accent/15 text-crimson-accent border border-crimson-accent/30 animate-pulse'
                : 'bg-emerald-accent/15 text-emerald-accent border border-emerald-accent/30'
            )}
          >
            {isVolatile ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                Шторм волатильності (High Volatility)
              </>
            ) : (
              <>
                <Waves className="w-3.5 h-3.5" />
                Спокійний ринок (Calm Market)
              </>
            )}
          </span>
        ) : (
          <span className="text-xs text-text-muted">Очікування даних від хабу…</span>
        )}
      </div>

      {!volatility ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2">
          {['Поточний ATR', 'Стан ринку', 'Рекомендований SL %', 'Рівень ціни SL'].map((label, idx) => (
            <div key={idx} className="bg-bg/60 rounded-xl p-3 border border-border/50 animate-pulse">
              <div className="text-xs text-text-muted mb-2">{label}</div>
              <div className="h-5 bg-card rounded w-20" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* ATR Stat */}
          <div className="bg-bg/80 border border-border/60 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-accent" />
              <span>Показник ATR (14)</span>
            </div>
            <div className="text-xl font-bold font-mono text-blue-accent">
              {volatility.atr.toFixed(2)}
              <span className="text-xs font-normal text-text-muted ml-1.5">USDT</span>
            </div>
            <div className="text-[11px] text-text-secondary mt-1">
              Середній істинний діапазон
            </div>
          </div>

          {/* Market State Stat */}
          <div className="bg-bg/80 border border-border/60 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
              <ShieldAlert className={clsx('w-3.5 h-3.5', isVolatile ? 'text-crimson-accent' : 'text-emerald-accent')} />
              <span>Стан динаміки</span>
            </div>
            <div className={clsx('text-xl font-bold font-mono', isVolatile ? 'text-crimson-accent' : 'text-emerald-accent')}>
              {isVolatile ? 'Шторм' : 'Спокійний'}
            </div>
            <div className="text-[11px] text-text-secondary mt-1">
              {isVolatile ? 'Підвищений ризик пробою' : 'Нормальний діапазон коливань'}
            </div>
          </div>

          {/* Recommended SL % Stat */}
          <div className="bg-bg/80 border border-border/60 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
              <Percent className="w-3.5 h-3.5 text-crimson-accent" />
              <span>Рекомендований SL %</span>
            </div>
            <div className="text-xl font-bold font-mono text-crimson-accent">
              -{volatility.recommendedSLPercent.toFixed(2)}%
            </div>
            <div className="text-[11px] text-text-secondary mt-1">
              Динамічний буфер волатильності
            </div>
          </div>

          {/* Recommended SL Price Stat */}
          <div className="bg-bg/80 border border-border/60 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-accent" />
              <span>Розрахункова ціна SL</span>
            </div>
            <div className="text-xl font-bold font-mono text-text-primary">
              ${volatility.recommendedSLPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-text-secondary mt-1">
              {currentPrice
                ? `Дельта: -$${Math.max(0, currentPrice - volatility.recommendedSLPrice).toFixed(2)}`
                : 'Адаптивний тригер'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
