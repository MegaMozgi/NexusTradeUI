import { useEffect, useRef } from 'react'
import { useSignalRContext, type SignalRCallbacks } from '../contexts/SignalRContext'

export function useSignalR(callbacks: SignalRCallbacks = {}) {
  const { status, latencyMs, reconnect, registerCallbacks } = useSignalRContext()
  const callbacksRef = useRef<SignalRCallbacks>(callbacks)

  useEffect(() => {
    callbacksRef.current = callbacks
  }, [callbacks])

  useEffect(() => {
    const unregister = registerCallbacks({
      onPriceUpdate: (data) => callbacksRef.current.onPriceUpdate?.(data),
      onVolatilityData: (data) => callbacksRef.current.onVolatilityData?.(data),
      onLatencyMetrics: (data) => callbacksRef.current.onLatencyMetrics?.(data),
      onBotNotification: (data) => callbacksRef.current.onBotNotification?.(data),
    })

    return () => {
      unregister()
    }
  }, [registerCallbacks])

  return { status, latencyMs, reconnect }
}
