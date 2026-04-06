'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ShieldOff, Loader2 } from 'lucide-react'

export function RoleGate({ role, children }: { role: string; children: React.ReactNode }) {
  const [hasRole, setHasRole] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase.rpc('has_role', { uid: user.id, role_name: role })
      setHasRole(data === true)
    }
    check()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (hasRole === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <Loader2 size={24} className="text-text-muted animate-spin" />
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
        <p className="text-sm text-text-muted max-w-sm mb-4">
          Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn nghĩ đây là lỗi.
        </p>
      </div>
    )
  }

  return <>{children}</>
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
      if (!user) router.push('/login')
    }
    check()
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
