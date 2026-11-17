import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/axios'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/Auth/login', form)
      login(data.token, data.user)
      navigate('/dashboard')
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(errorMsg || 'Невірні облікові дані або помилка авторизації')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-accent/10 border border-emerald-accent/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-emerald-accent" />
          </div>
          <span className="text-2xl font-bold text-text-primary tracking-tight">VolatiGuard</span>
        </div>

        <div className="card">
          <h1 className="text-xl font-semibold text-text-primary mb-1">З поверненням</h1>
          <p className="text-sm text-text-secondary mb-6">Авторизуйтесь для доступу до терміналу</p>

          {error && (
            <div className="flex items-center gap-2 bg-crimson-accent/10 border border-crimson-accent/20 rounded-lg px-3 py-2.5 mb-4">
              <AlertCircle className="w-4 h-4 text-crimson-accent shrink-0" />
              <span className="text-sm text-crimson-accent">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Електронна пошта
              </label>
              <input
                type="email"
                className="input"
                placeholder="trader@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Пароль
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Вхід до системи…' : 'Увійти'}
            </button>
          </form>

          <p className="text-sm text-text-secondary text-center mt-6">
            Немає облікового запису?{' '}
            <Link to="/register" className="text-emerald-accent hover:underline">
              Зареєструватися
            </Link>
          </p>
        </div>

        <p className="text-xs text-text-muted text-center mt-6">
          Bybit Testnet · Інституційний аналіз волатильності
        </p>
      </div>
    </div>
  )
}
