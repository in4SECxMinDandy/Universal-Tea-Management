'use client'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isAuthError } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { LogIn, UserPlus, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { TurnstileBox } from '@/components/auth/TurnstileBox'

// #region agent debug
const LOG = (h: string, m: string, d: unknown) =>
  fetch('/api/debug/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: '6649c4', location: 'login/page.tsx', message: m, data: d, runId: 'hypothesis-test', hypothesisId: h, timestamp: Date.now() }),
  }).catch(() => {})
// #endregion

const SUPABASE_CONFIG_ERROR_VI =
  'Chưa cấu hình Supabase: mở file .env.local và đặt NEXT_PUBLIC_SUPABASE_URL (Project URL) cùng NEXT_PUBLIC_SUPABASE_ANON_KEY (anon public key) từ Supabase Dashboard → Settings → API. Sau đó khởi động lại dev server.'

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
    'Nếu Supabase đã bật CAPTCHA (Authentication → Bot Protection): thêm NEXT_PUBLIC_TURNSTILE_SITE_KEY vào .env.local và khởi động lại dev server, hoặc tắt CAPTCHA tạm thời. Kiểm tra Email provider đã bật và URL dự án trong .env.local trùng với project nơi bạn tạo user.'

  if (status === 422) {
    return `${raw}${raw ? ' — ' : ''}${hint422}`
  }

  return raw || 'Đăng nhập thất bại.'
}

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const onCaptchaToken = useCallback((t: string | null) => {
    setCaptchaToken(t)
  }, [])

  // #region agent debug
  useEffect(() => {
    LOG('H3', 'ENV_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
    LOG('H3', 'ENV_SUPABASE_KEY_PREFIX', (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'MISSING').substring(0, 20))
    LOG('H3', 'TURNSTILE_CONFIGURED', !!TURNSTILE_SITE_KEY)
  }, [])
  // #endregion

  const captchaRequired = Boolean(TURNSTILE_SITE_KEY)
  const captchaOk = !captchaRequired || Boolean(captchaToken)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const emailTrimmed = email.trim()

    // #region agent debug: probe raw auth endpoint
    LOG('H5', 'AUTH_PROBE_REQUEST', { emailLen: emailTrimmed.length, hasCaptcha: !!captchaToken })
    ;(async () => {
      try {
        const body = JSON.stringify({ email: emailTrimmed, password, ...(captchaToken ? { captcha_token: captchaToken } : {}) })
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body,
        })
        const text = await res.text()
        LOG('H5', 'AUTH_PROBE_RESPONSE', {
          status: res.status,
          statusText: res.statusText,
          body: text.substring(0, 500),
        })
      } catch (e) {
        LOG('H5', 'AUTH_PROBE_ERROR', { msg: e instanceof Error ? e.message : String(e) })
      }
    })()
    // #endregion

    // #region agent debug
    LOG('H1', 'handleSubmit_ENTER', { isRegister, url: process.env.NEXT_PUBLIC_SUPABASE_URL, emailLen: emailTrimmed.length })
    // #endregion

    if (isSupabaseEnvPlaceholder()) {
      // #region agent debug
      LOG('H1', 'BLOCKED_PLACEHOLDER_ENV', { blocked: true })
      // #endregion
      setError(SUPABASE_CONFIG_ERROR_VI)
      setLoading(false)
      return
    }

    if (captchaRequired && !captchaToken) {
      setError('Vui lòng hoàn thành xác minh CAPTCHA (Turnstile) trước khi tiếp tục.')
      setLoading(false)
      return
    }

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email: emailTrimmed,
          password,
          options: {
            data: { full_name: fullName },
            ...(captchaToken ? { captchaToken } : {}),
          },
        })
        // #region agent debug
        LOG('H1', 'signUp_RESPONSE', {
          hasError: !!error,
          errorMsg: error?.message,
          status: isAuthError(error) ? error.status : undefined,
          code: isAuthError(error) ? error.code : undefined,
        })
        // #endregion
        if (error) throw error
        setRegistered(true)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailTrimmed,
          password,
          ...(captchaToken ? { options: { captchaToken } } : {}),
        })
        // #region agent debug
        LOG('H1', 'signIn_RESPONSE', {
          hasError: !!error,
          errorMsg: error?.message,
          status: isAuthError(error) ? error.status : undefined,
          code: isAuthError(error) ? error.code : undefined,
        })
        // #endregion
        if (error) throw error
        router.push('/')
      }
    } catch (err: unknown) {
      const msg = formatAuthFailureMessage(err)
      // #region agent debug
      LOG('H1', 'handleSubmit_CATCH', {
        msg,
        status: isAuthError(err) ? err.status : undefined,
        code: isAuthError(err) ? err.code : undefined,
      })
      // #endregion
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Card */}
        <div className="card-base p-8 sm:p-10">
          {/* Success state (post-registration) */}
          {registered ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-green-light mb-6">
                <CheckCircle2 size={32} className="text-accent-green" />
              </div>
              <h1 className="text-2xl font-bold text-primary mb-3">
                Đăng ký thành công!
              </h1>
              <p className="text-sm text-text-muted mb-2">
                Chúng tôi đã gửi email xác nhận đến
              </p>
              <p className="text-sm font-medium text-primary mb-6 break-all">{email}</p>
              <p className="text-xs text-text-muted mb-8">
                Vui lòng kiểm tra hộp thư và nhấn vào liên kết xác nhận để kích hoạt tài khoản.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => { setRegistered(false); setIsRegister(false); setEmail(''); setPassword(''); setFullName('') }}
                  className="btn-primary w-full"
                >
                  Đăng nhập ngay
                </button>
                <a href="/" className="btn-secondary w-full block text-center">
                  Quay lại trang chủ
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/5 mb-4">
                  {isRegister ? (
                    <UserPlus size={24} className="text-primary" />
                  ) : (
                    <LogIn size={24} className="text-primary" />
                  )}
                </div>
                <h1 className="text-2xl font-bold text-primary">
                  {isRegister ? 'Tạo tài khoản mới' : 'Chào mừng trở lại'}
                </h1>
                <p className="text-sm text-text-muted mt-1">
                  {isRegister
                    ? 'Điền thông tin để đăng ký tài khoản'
                    : 'Đăng nhập để tiếp tục mua sắm'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Full name (register only) */}
                {isRegister && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-primary" htmlFor="fullName">
                      Họ tên
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      placeholder="VD: Nguyễn Văn A"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                )}

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-primary" htmlFor="email">
                    Email <span className="text-accent-red">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
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
                      placeholder={isRegister ? 'Ít nhất 6 ký tự' : 'Nhập mật khẩu'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="input-field pr-10"
                      required
                      minLength={6}
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
                  <div className="space-y-1.5">
                    <p className="text-xs text-text-muted">Xác minh bảo mật</p>
                    <TurnstileBox siteKey={TURNSTILE_SITE_KEY} onToken={onCaptchaToken} />
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-accent-red-light text-accent-red text-sm">
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
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <span>{isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</span>
                  )}
                </button>
              </form>

              {/* Toggle */}
              <div className="mt-6 text-center">
                <p className="text-sm text-text-muted">
                  {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
                  <button
                    onClick={() => {
                      setIsRegister(!isRegister)
                      setError('')
                      setRegistered(false)
                    }}
                    className="font-medium text-primary hover:underline cursor-pointer transition-colors duration-150"
                  >
                    {isRegister ? 'Đăng nhập ngay' : 'Đăng ký miễn phí'}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Info note */}
        <p className="text-xs text-text-muted text-center mt-4">
          Bằng việc đăng ký, bạn đồng ý với{' '}
          <button className="underline cursor-pointer hover:text-primary transition-colors">
            Điều khoản sử dụng
          </button>{' '}
          và{' '}
          <button className="underline cursor-pointer hover:text-primary transition-colors">
            Chính sách bảo mật
          </button>
          .
        </p>
      </div>
    </div>
  )
}
