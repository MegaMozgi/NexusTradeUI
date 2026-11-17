import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'
import type { PriceUpdate, VolatilityData, LatencyMetrics, BotNotification } from '../types'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

interface SignalRContextType {
  status: ConnectionStatus
  latencyMs: number | null
  reconnect: () => Promise<void>
  registerCallbacks: (callbacks: SignalRCallbacks) => () => void
}

export interface SignalRCallbacks {
  onPriceUpdate?: (data: PriceUpdate) => void
  onVolatilityData?: (data: VolatilityData) => void
  onLatencyMetrics?: (data: LatencyMetrics) => void
  onBotNotification?: (data: BotNotification) => void
}

const SignalRContext = createContext<SignalRContextType | null>(null)

export function SignalRProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const connectionRef = useRef<signalR.HubConnection | null>(null)

  // Store active callback sets
  const listenersRef = useRef<Set<SignalRCallbacks>>(new Set())

  const registerCallbacks = useCallback((callbacks: SignalRCallbacks) => {
    listenersRef.current.add(callbacks)
    return () => {
      listenersRef.current.delete(callbacks)
    }
  }, [])

  const connect = useCallback(async () => {
    if (connectionRef.current) {
      const state = connectionRef.current.state
      if (
        state === signalR.HubConnectionState.Connected ||
        state === signalR.HubConnectionState.Connecting ||
        state === signalR.HubConnectionState.Reconnecting
      ) {
        return
      }
    }

    const token = localStorage.getItem('token') ?? ''
    const hubUrl = '/hubs/trading'

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    connection.on('ReceivePriceUpdate', (data: PriceUpdate) => {
      listenersRef.current.forEach(listener => listener.onPriceUpdate?.(data))
    })

    connection.on('ReceiveVolatilityData', (data: VolatilityData) => {
      listenersRef.current.forEach(listener => listener.onVolatilityData?.(data))
    })

    connection.on('ReceiveLatencyMetrics', (data: LatencyMetrics) => {
      setLatencyMs(data.pingMs)
      listenersRef.current.forEach(listener => listener.onLatencyMetrics?.(data))
    })

    connection.on('ReceiveBotNotification', (data: BotNotification) => {
      listenersRef.current.forEach(listener => listener.onBotNotification?.(data))
    })

    connection.onreconnecting(() => setStatus('connecting'))
    connection.onreconnected(() => setStatus('connected'))
    connection.onclose(() => setStatus('disconnected'))

    connectionRef.current = connection
    setStatus('connecting')

    try {
      await connection.start()
      setStatus('connected')
    } catch {
      setStatus('disconnected')
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {})
        connectionRef.current = null
      }
    }
  }, [connect])

  return (
    <SignalRContext.Provider
      value={{
        status,
        latencyMs,
        reconnect: connect,
        registerCallbacks,
      }}
    >
      {children}
    </SignalRContext.Provider>
  )
}

export function useSignalRContext() {
  const ctx = useContext(SignalRContext)
  if (!ctx) {
    throw new Error('useSignalRContext must be used within a SignalRProvider')
  }
  return ctx
}
