'use client'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isAuthError } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { LogIn, UserPlus, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { TurnstileBox } from '@/components/auth/TurnstileBox'

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
        if (error) throw error
        setRegistered(true)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailTrimmed,
          password,
          ...(captchaToken ? { options: { captchaToken } } : {}),
        })
        if (error) throw error
        const params = new URLSearchParams(window.location.search)
        const redirect = params.get('redirect')
        window.location.href = redirect ? `/${redirect}` : '/'
      }
    } catch (err: unknown) {
      const msg = formatAuthFailureMessage(err)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="card-base p-8 sm:p-10 border-gold/10">
          {registered ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-green-light mb-6">
                <CheckCircle2 size={32} className="text-accent-green" />
              </div>
              <h1 className="text-2xl font-display font-bold text-primary mb-3">
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
                  className="btn-primary w-full rounded-full"
                >
                  Đăng nhập ngay
                </button>
                <a href="/" className="btn-secondary w-full block text-center rounded-full">
                  Quay lại trang chủ
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/10 to-gold/5 mb-4">
                  {isRegister ? (
                    <UserPlus size={24} className="text-gold" />
                  ) : (
                    <LogIn size={24} className="text-gold" />
                  )}
                </div>
                <h1 className="text-2xl font-display font-bold text-primary">
                  {isRegister ? 'Tạo Tài Khoản' : 'Chào Mừng Trở Lại'}
                </h1>
                <p className="text-sm text-text-muted mt-1">
                  {isRegister
                    ? 'Đăng ký để trải nghiệm dịch vụ UniTEA'
                    : 'Đăng nhập để tiếp tục thưởng thức'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-gold cursor-pointer transition-colors duration-200"
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

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-accent-red-light text-accent-red text-sm">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !captchaOk}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-2 rounded-full"
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

              <div className="mt-6 text-center">
                <p className="text-sm text-text-muted">
                  {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
                  <button
                    onClick={() => {
                      setIsRegister(!isRegister)
                      setError('')
                      setRegistered(false)
                    }}
                    className="font-medium text-gold hover:underline cursor-pointer transition-colors duration-200"
                  >
                    {isRegister ? 'Đăng nhập ngay' : 'Đăng ký miễn phí'}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>

        <p className="text-xs text-text-muted text-center mt-4">
          Bằng việc đăng ký, bạn đồng ý với{' '}
          <button className="underline cursor-pointer hover:text-gold transition-colors">
            Điều khoản sử dụng
          </button>{' '}
          và{' '}
          <button className="underline cursor-pointer hover:text-gold transition-colors">
            Chính sách bảo mật
          </button>
          .
        </p>

        <div className="mt-8 flex justify-center">
          <a 
            href="/adminlogin" 
            className="text-[11px] font-medium text-text-muted hover:text-gold flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gold/5 transition-all duration-300"
          >
            <span>Dành cho nhân viên cửa hàng</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}
