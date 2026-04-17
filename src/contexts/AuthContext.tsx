'use client'
import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { withTimeout } from '@/lib/utils'

interface AuthContextValue {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAdmin: false,
  isLoading: true,
  refreshAuth: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

interface AuthProviderProps {
  children: ReactNode
  initialUser?: User | null
  initialAdmin?: boolean
}

export function AuthProvider({ children, initialUser, initialAdmin }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser ?? null)
  const [isAdmin, setIsAdmin] = useState(initialAdmin ?? false)
  const [isLoading, setIsLoading] = useState(initialUser === undefined)
  const supabase = useMemo(() => createClient(), [])

  const resolveAdminRole = useCallback(async (userId: string) => {
    try {
      const { data } = await withTimeout(
        supabase.rpc('has_role', { uid: userId, role_name: 'STORE_ADMIN' }),
        4000,
        'Khong the kiem tra quyen truy cap luc nay.'
      )
      return data === true
    } catch {
      return false
    }
  }, [supabase])

  useEffect(() => {
    let mounted = true

    const syncUserState = (nextUser: User | null) => {
      if (!mounted) return

      setUser(nextUser)
      setIsLoading(false)

      if (!nextUser) {
        setIsAdmin(false)
        return
      }

      setIsAdmin(false)
      void resolveAdminRole(nextUser.id).then((adminRole) => {
        if (mounted) {
          setIsAdmin(adminRole)
        }
      })
    }

    async function init() {
      try {
        const {
          data: { session },
        } = await withTimeout(
          supabase.auth.getSession(),
          5000,
          'Khong the tai trang thai dang nhap.'
        )
        syncUserState(session?.user ?? null)
      } catch {
        if (!mounted) return
        setUser(null)
        setIsAdmin(false)
        setIsLoading(false)
      }
    }

    void init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_OUT') {
          syncUserState(null)
          return
        }

        syncUserState(session?.user ?? null)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [resolveAdminRole, supabase])

  const refreshAuth = useCallback(async () => {
    setIsLoading(true)
    try {
      const {
        data: { session },
      } = await withTimeout(
        supabase.auth.getSession(),
        5000,
        'Khong the tai trang thai dang nhap.'
      )

      if (session?.user) {
        setUser(session.user)
        setIsAdmin(await resolveAdminRole(session.user.id))
      } else {
        setUser(null)
        setIsAdmin(false)
      }
    } catch {
      setUser(null)
      setIsAdmin(false)
    } finally {
      setIsLoading(false)
    }
  }, [resolveAdminRole, supabase])

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  )
}
