'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ShieldOff, Loader2 } from 'lucide-react'

export function RoleGate({ role, children }: { role: string; children: React.ReactNode }) {
  // null = đang kiểm tra, true = có quyền, false = không có quyền
  const [hasRole, setHasRole] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function check() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user

        if (!user) {
          // Chưa đăng nhập — điều hướng về trang đăng nhập admin
          router.replace('/adminlogin')
          return
        }

        // Kiểm tra role với timeout 8 giây để tránh treo vô tận
        const roleCheckResult = await Promise.race([
          supabase.rpc('has_role', { uid: user.id, role_name: role }),
          new Promise<{ data: boolean | null }>(resolve =>
            setTimeout(() => resolve({ data: null }), 8000)
          ),
        ]) as { data: boolean | null }

        setHasRole(roleCheckResult.data === true)
      } catch (err) {
        console.error('RoleGate check error:', err)
        setHasRole(false)
      }
    }

    check()

    // Lắng nghe thay đổi auth (đăng xuất / đăng nhập lại)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          setHasRole(null)
          router.replace('/adminlogin')
        }
      }
    )

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  if (hasRole === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <Loader2 size={28} className="text-text-muted animate-spin" />
        <p className="text-sm text-text-muted">Đang kiểm tra quyền truy cập...</p>
      </div>
    )
  }

  if (!hasRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-accent-red-light flex items-center justify-center mb-4">
          <ShieldOff size={28} className="text-accent-red" />
        </div>
        <h3 className="text-lg font-bold text-primary mb-2">Không có quyền truy cập</h3>
        <p className="text-sm text-text-muted max-w-sm mb-6">
          Bạn không có quyền truy cập trang này. Vui lòng đăng nhập bằng tài khoản quản trị viên.
        </p>
        <button
          onClick={() => router.push('/adminlogin')}
          className="btn-primary text-sm rounded-full px-6"
        >
          Về trang đăng nhập Admin
        </button>
      </div>
    )
  }

  return <>{children}</>
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setIsAuthenticated(!!session?.user)
        if (!session?.user) router.push('/login')
      } catch {
        setIsAuthenticated(false)
        router.push('/login')
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user)
      if (!session?.user) router.push('/login')
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <Loader2 size={24} className="text-text-muted animate-spin" />
        <p className="text-sm text-text-muted">Đang kiểm tra đăng nhập...</p>
      </div>
    )
  }

  return <>{children}</>
}
