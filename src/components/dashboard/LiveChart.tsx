import { useEffect, useRef } from 'react'
import {
  createChart,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
} from 'lightweight-charts'
import type { PriceUpdate, VolatilityData } from '../../types'

interface Props {
  symbol: string
  latestPrice: PriceUpdate | null
  volatility: VolatilityData | null
}

export default function LiveChart({ symbol, latestPrice, volatility }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const staticSLLineRef = useRef<IPriceLine | null>(null)
  const adaptiveSLLineRef = useRef<IPriceLine | null>(null)
  const lastPriceRef = useRef<number>(95000)

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#181A20' },
        textColor: '#848E9C',
      },
      grid: {
        vertLines: { color: '#2B2F36' },
        horzLines: { color: '#2B2F36' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#2B2F36',
      },
      timeScale: {
        borderColor: '#2B2F36',
        timeVisible: true,
        secondsVisible: true,
      },
      width: containerRef.current.clientWidth,
      height: 400,
    })

    const series = chart.addCandlestickSeries({
      upColor: '#00D4A8',
      downColor: '#FF4D6A',
      borderUpColor: '#00D4A8',
      borderDownColor: '#FF4D6A',
      wickUpColor: '#00D4A8',
      wickDownColor: '#FF4D6A',
    })

    // Seed with baseline historical candles
    const now = Math.floor(Date.now() / 1000)
    let currentBase = 95200
    const candles = Array.from({ length: 60 }, (_, i) => {
      const time = (now - (60 - i) * 60) as unknown as number
      const delta = (Math.random() - 0.49) * 120
      const open = currentBase
      const close = open + delta
      const high = Math.max(open, close) + Math.random() * 45
      const low = Math.min(open, close) - Math.random() * 45
      currentBase = close
      return { time, open, high, low, close }
    })

    series.setData(candles as unknown as Parameters<typeof series.setData>[0])
    lastPriceRef.current = currentBase

    chartRef.current = chart
    seriesRef.current = series

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth })
      }
    }

    const resizeObserver = new ResizeObserver(() => handleResize())
    resizeObserver.observe(containerRef.current)
    window.addEventListener('resize', handleResize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [symbol])

  // Update real-time candle from SignalR price update
  useEffect(() => {
    if (!latestPrice || !seriesRef.current) return

    const price = latestPrice.price
    lastPriceRef.current = price

    const time = (Math.floor(new Date(latestPrice.timestamp).getTime() / 1000)) as unknown as number

    seriesRef.current.update({
      time: time as unknown as Parameters<typeof seriesRef.current.update>[0]['time'],
      open: price,
      high: price,
      low: price,
      close: price,
    })
  }, [latestPrice])

  // Update Stop-Loss horizontal overlay lines
  useEffect(() => {
    if (!seriesRef.current) return

    const currentPrice = latestPrice?.price ?? lastPriceRef.current

    // 1. Red dashed line: Static Stop-Loss (fixed 2% drop)
    const staticSLPrice = currentPrice * 0.98
    if (staticSLLineRef.current) {
      seriesRef.current.removePriceLine(staticSLLineRef.current)
    }
    staticSLLineRef.current = seriesRef.current.createPriceLine({
      price: staticSLPrice,
      color: '#FF4D6A',
      lineWidth: 2,
      lineStyle: 2, // Dashed
      axisLabelVisible: true,
      title: 'Статичний SL (-2.0%)',
    })

    // 2. Bright Blue/Green solid line: Adaptive Stop-Loss (dynamically shifts based on ReceiveVolatilityData)
    if (volatility && volatility.recommendedSLPrice > 0) {
      if (adaptiveSLLineRef.current) {
        seriesRef.current.removePriceLine(adaptiveSLLineRef.current)
      }
      adaptiveSLLineRef.current = seriesRef.current.createPriceLine({
        price: volatility.recommendedSLPrice,
        color: '#00D4A8',
        lineWidth: 2,
        lineStyle: 0, // Solid
        axisLabelVisible: true,
        title: `Адаптивний SL (-${volatility.recommendedSLPercent.toFixed(2)}%)`,
      })
    }
  }, [latestPrice, volatility])

  const displayPrice = latestPrice?.price ?? lastPriceRef.current

  return (
    <div className="card p-0 overflow-hidden border border-border">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-border bg-card/60">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-text-primary tracking-wide">{symbol}</span>
          <span className="text-xl font-mono font-bold text-emerald-accent">
            ${displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {latestPrice && (
            <span className="text-xs text-text-muted">
              Оновлено: {new Date(latestPrice.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Legend for Stop-Loss lines */}
        <div className="flex items-center gap-5 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-5 h-0 border-t-2 border-dashed border-crimson-accent inline-block" />
            <span className="text-text-secondary font-medium">Статичний SL (Фікс. -2%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-0.5 bg-emerald-accent inline-block shadow-sm shadow-emerald-accent/50" />
            <span className="text-emerald-accent font-medium">Адаптивний SL (ATR динамічний)</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div ref={containerRef} className="w-full relative min-h-[400px]" />
    </div>
  )
}
