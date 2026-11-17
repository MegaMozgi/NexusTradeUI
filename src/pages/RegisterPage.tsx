import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/axios'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Введені паролі не співпадають')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/Auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
      })
      login(data.token, data.user)
      navigate('/dashboard')
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(errorMsg || 'Помилка під час реєстрації')
    } finally {
      setLoading(false)
    }
  }

  const pwStrong = form.password.length >= 8

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
          <h1 className="text-xl font-semibold text-text-primary mb-1">Створення акаунта</h1>
          <p className="text-sm text-text-secondary mb-6">Почніть роботу з платформою VolatiGuard</p>

          {error && (
            <div className="flex items-center gap-2 bg-crimson-accent/10 border border-crimson-accent/20 rounded-lg px-3 py-2.5 mb-4">
              <AlertCircle className="w-4 h-4 text-crimson-accent shrink-0" />
              <span className="text-sm text-crimson-accent">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Ім'я користувача
              </label>
              <input
                type="text"
                className="input"
                placeholder="TraderPro"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
              />
            </div>
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
                  placeholder="Мінімум 8 символів"
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
              {form.password && (
                <div
                  className={`flex items-center gap-1 mt-1.5 text-xs ${
                    pwStrong ? 'text-emerald-accent' : 'text-crimson-accent'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {pwStrong ? 'Надійний пароль' : 'Потрібно мінімум 8 символів'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Підтвердження пароля
              </label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Створення облікового запису…' : 'Зареєструватися'}
            </button>
          </form>

          <p className="text-sm text-text-secondary text-center mt-6">
            Вже маєте обліковий запис?{' '}
            <Link to="/login" className="text-emerald-accent hover:underline">
              Увійти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
