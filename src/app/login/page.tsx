'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })
        if (error) throw error
        router.push('/')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/')
      }
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <h1 className="text-2xl font-bold mb-6">{isRegister ? 'Đăng ký' : 'Đăng nhập'}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isRegister && (
          <input
            type="text"
            placeholder="Họ tên"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="border px-3 py-2 rounded"
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border px-3 py-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border px-3 py-2 rounded"
          required
          minLength={6}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50 cursor-pointer transition-colors"
        >
          {loading ? 'Đang xử lý...' : isRegister ? 'Đăng ký' : 'Đăng nhập'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
        <button onClick={() => setIsRegister(!isRegister)} className="text-primary underline cursor-pointer">
          {isRegister ? 'Đăng nhập' : 'Đăng ký'}
        </button>
      </p>
    </div>
  )
}
