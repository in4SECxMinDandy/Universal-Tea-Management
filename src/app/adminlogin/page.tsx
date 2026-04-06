'use client'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isAuthError } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { Settings, Eye, EyeOff, Loader2 } from 'lucide-react'
import { TurnstileBox } from '@/components/auth/TurnstileBox'

const SUPABASE_CONFIG_ERROR_VI =
  'Chưa cấu hình Supabase: mở file .env.local và cấu hình NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY.'

function isSupabaseEnvPlaceholder(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  if (!url.trim() || !key.trim()) return true
  if (url.includes('your-project') || url.includes('placeholder')) return true
  if (key === 'your-anon-key-here' || key.startsWith('your-anon')) return true
  return false
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

function formatAuthFailureMessage(err: unknown): string {
  if (!isAuthError(err)) {
    return err instanceof Error ? err.message : 'Đăng nhập thất bại.'
  }
  const code = err.code
  const status = err.status
  const raw = err.message

  if (code === 'invalid_credentials' || /invalid login credentials/i.test(raw)) {
    return 'Email hoặc mật khẩu không đúng.'
  }

  const hint422 =
    'Nếu Supabase đã bật CAPTCHA (Authentication → Bot Protection): thêm NEXT_PUBLIC_TURNSTILE_SITE_KEY vào .env.local và khởi động lại dev server, hoặc tắt CAPTCHA tạm thời.'

  if (status === 422) {
    return `${raw}${raw ? ' — ' : ''}${hint422}`
  }

  return raw || 'Đăng nhập thất bại.'
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const onCaptchaToken = useCallback((t: string | null) => {
    setCaptchaToken(t)
  }, [])

  const captchaRequired = Boolean(TURNSTILE_SITE_KEY)
  const captchaOk = !captchaRequired || Boolean(captchaToken)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const emailTrimmed = email.trim()

    if (isSupabaseEnvPlaceholder()) {
      setError(SUPABASE_CONFIG_ERROR_VI)
      setLoading(false)
      return
    }

    if (captchaRequired && !captchaToken) {
      setError('Vui lòng hoàn thành xác minh CAPTCHA trước khi tiếp tục.')
      setLoading(false)
      return
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password,
        ...(captchaToken ? { options: { captchaToken } } : {}),
      })

      if (signInError) throw signInError

      // Verify they have admin role right after login attempts
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user || null
      if (user) {
        const { data: hasRole } = await supabase.rpc('has_role', { uid: user.id, role_name: 'STORE_ADMIN' })
        if (hasRole !== true) {
          await supabase.auth.signOut()
          setError('Tài khoản này không có quyền quản trị viên.')
          setLoading(false)
          return
        }
      }

      window.location.href = '/admin'
    } catch (err: unknown) {
      setError(formatAuthFailureMessage(err))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-16 bg-surface-bg">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Card */}
        <div className="card-base p-8 sm:p-10 shadow-lg border border-border-subtle">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white mb-4 shadow-sm">
              <Settings size={28} />
            </div>
            <h1 className="text-2xl font-bold text-primary">
              Cổng Quản Trị
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Đăng nhập bằng tài khoản Admin để truy cập
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-primary" htmlFor="email">
                Email / Tài khoản <span className="text-accent-red">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@universaltea.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-primary" htmlFor="password">
                Mật khẩu <span className="text-accent-red">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-primary cursor-pointer transition-colors duration-150"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {TURNSTILE_SITE_KEY && (
              <div className="space-y-1.5 pt-2">
                <p className="text-xs text-text-muted">Xác minh bảo mật</p>
                <div className="min-h-[65px]">
                  <TurnstileBox siteKey={TURNSTILE_SITE_KEY} onToken={onCaptchaToken} />
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-accent-red-light/50 text-accent-red text-sm border border-accent-red/20">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !captchaOk}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-4 py-3"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <span>Đăng nhập hệ thống</span>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-8 text-center pt-6 border-t border-border-subtle">
            <p className="text-sm text-text-muted">
              Bạn không phải là admin?{' '}
              <a href="/login" className="font-medium text-primary hover:underline transition-colors duration-150">
                Đăng nhập khách hàng
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
