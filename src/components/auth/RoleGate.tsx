'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function RoleGate({ role, children }: { role: string; children: React.ReactNode }) {
  const [hasRole, setHasRole] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('user_roles')
        .select('role:roles(name)')
        .eq('user_id', user.id)
        .limit(1)

      const roleName = (data?.[0] as unknown as { role: { name: string } })?.role?.name
      setHasRole(roleName === role)
    }
    check()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (hasRole === null) return null
  if (!hasRole) return <p>Bạn không có quyền truy cập trang này.</p>
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

  if (isAuthenticated === null) return null
  return <>{children}</>
}
