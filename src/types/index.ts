export interface User {
  id: string
  username: string
  email: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface PortfolioCoin {
  coin: string
  free: number
  locked: number
  estimatedValueUsdt: number
}

export interface PortfolioBalanceResponse {
  coins: PortfolioCoin[]
  totalEquityUsdt: number
}

// Backward-compatible alias
export type PortfolioBalance = PortfolioCoin

export interface TradingSession {
  id?: string
  sessionId?: string
  symbol: string
  entryPrice: number
  stopLoss?: number
  stopLossPrice?: number
  currentPrice?: number
  pnl?: number
  status: string
  createdAt?: string
}

export interface MarketOrderRequest {
  symbol: string
  side: 'Buy' | 'Sell'
  qty: number
}

export interface BotLog {
  id: string
  timestamp: string
  symbol: string
  action: 'BUY' | 'SELL' | 'HOLD'
  executionPrice: number
  atr: number
  adaptiveSLPercent: number
  status: 'EXECUTED' | 'PENDING' | 'FAILED'
}

export interface VolatilityData {
  symbol: string
  atr: number
  recommendedSLPercent: number
  recommendedSLPrice: number
  marketState: 'CALM' | 'HIGH_VOLATILITY'
}

export interface LatencyMetrics {
  pingMs: number
  timestamp: string
}

export interface PriceUpdate {
  symbol: string
  price: number
  timestamp: string
  volume?: number
}

export interface BotNotification {
  type: 'INFO' | 'BUY' | 'SELL' | 'WARNING' | 'ERROR'
  message: string
  symbol?: string
  price?: number
  timestamp: string
}

export interface CredentialsForm {
  apiKey: string
  apiSecret: string
  exchange?: string
}

export interface CredentialsStatus {
  exists: boolean
  maskedKey?: string
  exchange?: string
}
