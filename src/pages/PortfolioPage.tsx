import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, AlertCircle, Wallet, ArrowUpRight } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../lib/axios'
import type { PortfolioCoin, PortfolioBalanceResponse } from '../types'
import clsx from 'clsx'

const ASSET_COLORS = [
  '#00D4A8', // Emerald
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#10B981', // Green
  '#EF4444', // Red
  '#EAB308', // Yellow
  '#6366F1', // Indigo
]

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: {
      coin: string
      free: number
      locked: number
      estimatedValueUsdt: number
      chartValue: number
      isFallbackProportion: boolean
    }
  }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  const isFallback = d.payload.isFallbackProportion

  return (
    <div className="bg-card/95 border border-border rounded-xl px-4 py-3 shadow-2xl backdrop-blur-md">
      <div className="text-sm font-bold text-text-primary flex items-center gap-2">
        <span>{d.payload.coin}</span>
      </div>
      <div className="text-xs text-emerald-accent font-mono mt-1 font-semibold">
        ${d.payload.estimatedValueUsdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
      </div>
      <div className="text-[11px] text-text-secondary mt-1">
        Доступно: {d.payload.free.toLocaleString()} | Заблоковано: {d.payload.locked.toLocaleString()}
      </div>
      {isFallback && (
        <div className="text-[10px] text-amber-400 mt-1">
          * Пропорція розрахована за кількістю монет (оцінка 0 USDT)
        </div>
      )}
    </div>
  )
}

export default function PortfolioPage() {
  const [coins, setCoins] = useState<PortfolioCoin[]>([])
  const [totalEquityUsdt, setTotalEquityUsdt] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchBalances = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get<PortfolioBalanceResponse | PortfolioCoin[]>('/Portfolio/balance')
      const data = response.data

      let rawCoins: PortfolioCoin[] = []
      let equity = 0

      if (data && typeof data === 'object' && 'coins' in (data as unknown as Record<string, unknown>)) {
        // Standard expected ASP.NET Core response: { coins: [...], totalEquityUsdt: ... }
        const obj = data as unknown as { coins?: PortfolioCoin[]; totalEquityUsdt?: number }
        rawCoins = Array.isArray(obj.coins) ? obj.coins : []
        equity = typeof obj.totalEquityUsdt === 'number' ? obj.totalEquityUsdt : 0
      } else if (data && typeof data === 'object' && 'Coins' in (data as unknown as Record<string, unknown>)) {
        // PascalCase fallback: { Coins: [...], TotalEquityUsdt: ... }
        const pascalData = data as unknown as { Coins?: PortfolioCoin[]; TotalEquityUsdt?: number }
        rawCoins = Array.isArray(pascalData.Coins) ? pascalData.Coins : []
        equity = typeof pascalData.TotalEquityUsdt === 'number' ? pascalData.TotalEquityUsdt : 0
      } else if (Array.isArray(data)) {
        // Direct array fallback
        rawCoins = data
      }

      // Normalize each coin to ensure properties are present
      const normalizedCoins: PortfolioCoin[] = rawCoins.map((c: any) => ({
        coin: c.coin ?? c.Coin ?? 'UNKNOWN',
        free: Number(c.free ?? c.Free ?? 0),
        locked: Number(c.locked ?? c.Locked ?? 0),
        estimatedValueUsdt: Number(c.estimatedValueUsdt ?? c.EstimatedValueUsdt ?? c.usdtValue ?? c.UsdtValue ?? 0),
      }))

      // If backend totalEquityUsdt wasn't sent or is 0, calculate sum from coins
      const calculatedEquity = normalizedCoins.reduce((sum, c) => sum + (c.estimatedValueUsdt || 0), 0)
      const finalEquity = equity > 0 ? equity : calculatedEquity

      // Sort by estimated USDT value descending
      normalizedCoins.sort((a, b) => b.estimatedValueUsdt - a.estimatedValueUsdt)

      setCoins(normalizedCoins)
      setTotalEquityUsdt(finalEquity)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Не вдалося завантажити інформацію про баланс портфеля')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBalances()
  }, [fetchBalances])

  // Donut Chart data:
  // Use estimatedValueUsdt; fallback to (free + locked) if estimatedValueUsdt is 0 so the chart still displays proportions!
  const chartData = coins
    .filter(c => c.estimatedValueUsdt > 0 || (c.free + c.locked) > 0)
    .map(c => {
      const isFallback = !(c.estimatedValueUsdt > 0)
      const value = isFallback ? (c.free + c.locked) : c.estimatedValueUsdt
      return {
        name: c.coin,
        value: Number(value.toFixed(4)),
        coin: c.coin,
        free: c.free,
        locked: c.locked,
        estimatedValueUsdt: c.estimatedValueUsdt,
        chartValue: value,
        isFallbackProportion: isFallback,
      }
    })

  return (
    <div className="space-y-6">
      {/* Page Title & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Портфель та гаманець</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Огляд активів та капіталу на акаунті Bybit Testnet
          </p>
        </div>
        <button
          onClick={fetchBalances}
          disabled={loading}
          className="btn-ghost flex items-center gap-2 text-sm font-medium"
        >
          <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin text-emerald-accent')} />
          <span>Оновити баланси</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 bg-crimson-accent/10 border border-crimson-accent/20 rounded-xl px-4 py-3 text-sm text-crimson-accent">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Total Balance Hero Card */}
      <div className="card bg-gradient-to-r from-card via-card to-card-hover border border-border relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-emerald-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              <Wallet className="w-4 h-4 text-emerald-accent" />
              <span>Загальний капітал портфеля (Total Equity)</span>
            </div>
            {loading ? (
              <div className="h-10 w-56 bg-border/60 rounded animate-pulse" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-extrabold font-mono text-text-primary">
                  ${totalEquityUsdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-base font-semibold text-emerald-accent">USDT</span>
              </div>
            )}
            <p className="text-xs text-text-muted mt-2">
              Оцінка за спотовими ринковими цінами Bybit
            </p>
          </div>

          <div className="flex items-center gap-3 bg-bg/60 border border-border px-4 py-3 rounded-xl">
            <div className="text-right">
              <div className="text-xs text-text-secondary">Кількість монет:</div>
              <div className="text-base font-mono font-bold text-text-primary">{coins.length} активів</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-accent/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-emerald-accent" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Allocation Donut Chart + Asset Breakdown Table */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Donut Chart (2 cols) */}
          <div className="lg:col-span-2 card border border-border flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-text-primary">Розподіл активів (Allocation)</h2>
              <span className="text-xs text-text-muted">Діаграма часток</span>
            </div>

            {chartData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-text-muted text-sm">
                <Wallet className="w-10 h-10 mb-2 opacity-30" />
                <span>Немає активів для відображення діаграми</span>
              </div>
            ) : (
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="45%"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((_, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={ASSET_COLORS[idx % ASSET_COLORS.length]}
                          stroke="#181A20"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(val) => <span className="text-xs text-text-secondary font-medium">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Breakdown Table (3 cols) */}
          <div className="lg:col-span-3 card border border-border p-0 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-card/60">
              <h2 className="text-sm font-semibold text-text-primary">Деталізація активів</h2>
              <span className="text-xs text-text-muted font-mono">{coins.length} монет</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg/40 text-text-muted text-xs">
                    <th className="px-4 py-3 text-left font-medium">Актив</th>
                    <th className="px-4 py-3 text-right font-medium">Доступно (Free)</th>
                    <th className="px-4 py-3 text-right font-medium">В ордерах (Locked)</th>
                    <th className="px-4 py-3 text-right font-medium">Вартість (USDT)</th>
                    <th className="px-4 py-3 text-right font-medium">Частка %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {coins.map((c, idx) => {
                    const pct = totalEquityUsdt > 0 ? (c.estimatedValueUsdt / totalEquityUsdt) * 100 : 0
                    const color = ASSET_COLORS[idx % ASSET_COLORS.length]

                    return (
                      <tr key={c.coin} className="hover:bg-card-hover transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <div>
                              <span className="font-bold text-text-primary block">{c.coin}</span>
                              <span className="text-[10px] text-text-muted">Bybit Testnet</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-text-secondary">
                          {c.free.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-text-muted">
                          {c.locked.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-semibold text-text-primary">
                          ${c.estimatedValueUsdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-bg rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color }}
                              />
                            </div>
                            <span className="text-xs font-mono text-text-secondary w-10 text-right">
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {coins.length === 0 && (
                <div className="text-center py-16 text-text-muted text-sm">
                  Баланси не знайдено або відсутні кошти
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 card border border-border h-80 animate-pulse bg-card" />
          <div className="lg:col-span-3 card border border-border h-80 animate-pulse bg-card" />
        </div>
      )}
    </div>
  )
}
