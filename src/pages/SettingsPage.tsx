import { useState, useEffect, useCallback } from 'react'
import { KeyRound, ShieldCheck, ShieldAlert, Trash2, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Lock, ExternalLink } from 'lucide-react'
import api from '../lib/axios'
import type { CredentialsForm, CredentialsStatus } from '../types'
import clsx from 'clsx'

export default function SettingsPage() {
  const [status, setStatus] = useState<CredentialsStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState<CredentialsForm>({
    apiKey: '',
    apiSecret: '',
    exchange: 'Bybit Testnet',
  })
  const [showSecret, setShowSecret] = useState(false)

  // Check GET /api/Credentials/exists
  const checkCredentials = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get<boolean | { hasCredentials?: boolean; exists?: boolean }>('/Credentials/exists')
      
      const isConnected =
        typeof data === 'boolean'
          ? data
          : Boolean(data?.hasCredentials ?? data?.exists)

      setStatus({
        exists: isConnected,
        exchange: 'Bybit Testnet',
      })
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Не вдалося перевірити статус підключення біржі')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkCredentials()
  }, [checkCredentials])

  // Save new credentials (POST /api/Credentials)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.apiKey.trim() || !form.apiSecret.trim()) {
      setError('Будь ласка, заповніть API Key та API Secret')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/Credentials', form)
      setSuccess('Ключі Bybit Testnet успішно збережено та підключено')
      setForm({ apiKey: '', apiSecret: '', exchange: 'Bybit Testnet' })
      await checkCredentials()
      setTimeout(() => setSuccess(''), 4500)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Помилка під час збереження ключів')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete / Disconnect credentials (DELETE /api/Credentials)
  const handleDelete = async () => {
    if (!window.confirm('Ви впевнені, що бажаєте відключити та видалити API ключі?')) {
      return
    }

    setDeleting(true)
    setError('')
    setSuccess('')

    try {
      await api.delete('/Credentials')
      setSuccess('API ключі успішно видалено. Зв’язок із біржею розірвано.')
      setStatus({ exists: false })
      setTimeout(() => setSuccess(''), 4500)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Не вдалося видалити облікові дані')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">Налаштування API біржі</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Керування інтеграцією ключів Bybit Testnet для автоматичної торгівлі та виконання ордерів
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-3 bg-crimson-accent/10 border border-crimson-accent/25 rounded-xl px-4 py-3 text-sm text-crimson-accent">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 bg-emerald-accent/10 border border-emerald-accent/25 rounded-xl px-4 py-3 text-sm text-emerald-accent">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Status Hero Card */}
      <div className="card border border-border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={clsx(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                status?.exists
                  ? 'bg-emerald-accent/15 text-emerald-accent border border-emerald-accent/30'
                  : 'bg-card-hover text-text-muted border border-border'
              )}
            >
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">Статус з'єднання з Bybit:</span>
                {loading ? (
                  <span className="text-xs text-text-muted animate-pulse">Перевірка…</span>
                ) : status?.exists ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-accent/15 text-emerald-accent border border-emerald-accent/25">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    ПІДКЛЮЧЕНО
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-crimson-accent/15 text-crimson-accent border border-crimson-accent/25">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    НЕ ПІДКЛЮЧЕНО
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary mt-1">
                {status?.exists
                  ? 'API ключі активні та використовуються для синхронізації балансів і виконання ордерів.'
                  : 'Для роботи торгового терміналу та бота необхідно надати API Key та Secret з правами торгівлі.'}
              </p>
            </div>
          </div>

          <a
            href="https://testnet.bybit.com/app/user/api-management"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-accent hover:underline flex items-center gap-1 bg-emerald-accent/10 px-3 py-1.5 rounded-lg border border-emerald-accent/20"
          >
            <span>Отримати Testnet ключі</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Container: Connected Key Info OR Secure Form */}
      {loading ? (
        <div className="card border border-border h-64 animate-pulse bg-card" />
      ) : status?.exists ? (
        /* Connected state: show masked key status and Disconnect button */
        <div className="card border border-border space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Підключені облікові дані</h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Ключі надійно зашифровані на бекенді
              </p>
            </div>
            <span className="text-xs font-mono bg-bg px-2.5 py-1 rounded border border-border text-emerald-accent">
              Bybit V5 API
            </span>
          </div>

          <div className="space-y-4">
            <div className="bg-bg/80 border border-border/80 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-text-secondary">Біржа:</span>
                <span className="font-semibold text-text-primary">Bybit Testnet</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-text-secondary">Публічний API Key:</span>
                <span className="font-mono text-emerald-accent bg-card px-2.5 py-1 rounded border border-border/60">
                  {status.maskedKey || '••••••••••••••••bybit7A'}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-text-secondary">API Secret:</span>
                <span className="font-mono text-text-muted bg-card px-2.5 py-1 rounded border border-border/60">
                  ••••••••••••••••••••••••••••••••
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-border/40 text-text-muted">
                <span>Дозволи:</span>
                <span>Торгівля спот (Spot Trading) + Читання балансу</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Lock className="w-4 h-4 text-emerald-accent" />
                <span>З'єднання захищене за стандартом HMAC-SHA256</span>
              </div>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-danger flex items-center gap-2 text-sm py-2 px-4 font-semibold"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {deleting ? 'Видалення…' : 'Відключити / Видалити ключі'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Not connected state: show secure form (POST /api/Credentials) */
        <div className="card border border-border">
          <div className="border-b border-border pb-4 mb-5">
            <h2 className="text-base font-semibold text-text-primary">Підключення API ключів</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Введіть дані API з вашого облікового запису Bybit Testnet
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                API Key (Публічний ключ)
              </label>
              <input
                type="text"
                required
                className="input font-mono text-sm"
                placeholder="напр. 8xK9LmPqR3..."
                value={form.apiKey}
                onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                API Secret (Секретний ключ)
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  required
                  className="input font-mono text-sm pr-10"
                  placeholder="напр. W9xZ12aB34..."
                  value={form.apiSecret}
                  onChange={e => setForm(f => ({ ...f, apiSecret: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-3.5 bg-bg/70 border border-border/80 rounded-xl space-y-1.5 text-xs text-text-secondary">
              <div className="flex items-center gap-2 font-medium text-text-primary">
                <Lock className="w-3.5 h-3.5 text-emerald-accent" />
                <span>Вимоги до безпеки ключів:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-text-muted pl-1">
                <li>Використовуйте виключно ключі з <strong>Bybit Testnet</strong>.</li>
                <li>Не вмикайте права на виведення коштів (Withdrawal).</li>
                <li>Необхідні права: «Order / Trade» та «Position / Balance».</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={submitting || !form.apiKey || !form.apiSecret}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Збереження та перевірка…' : 'Підключити Bybit Testnet'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
