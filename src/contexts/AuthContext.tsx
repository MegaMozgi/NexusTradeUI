import React, { createContext, useContext, useState, useCallback } from 'react'
import type { User } from '../types'

interface AuthCtx {
  user: User | null
  token: string | null
  login: (token: string, user?: User | null) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(() => {
    try {
      const u = localStorage.getItem('user')
      if (!u || u === 'undefined') return null
      return JSON.parse(u)
    } catch {
      localStorage.removeItem('user')
      return null
    }
  })

  const login = useCallback((t: string, u?: User | null) => {
    localStorage.setItem('token', t)
    setToken(t)

    if (u) {
      localStorage.setItem('user', JSON.stringify(u))
      setUser(u)
    } else {
      localStorage.removeItem('user')
      setUser(null)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}