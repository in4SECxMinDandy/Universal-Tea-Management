'use client'
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

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

  const checkAdmin = useCallback(async (userId: string) => {
    try {
      const supabase = createClient()
      const { data } = await supabase.rpc('has_role', { uid: userId, role_name: 'STORE_ADMIN' })
      setIsAdmin(data === true)
    } catch {
      setIsAdmin(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function init() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        await checkAdmin(session.user.id)
      } else {
        setUser(null)
        setIsAdmin(false)
      }
      if (mounted) setIsLoading(false)
    }

    init()

    const { data: { subscription } } = createClient().auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setIsAdmin(false)
          return
        }
        if (session?.user) {
          setUser(session.user)
          await checkAdmin(session.user.id)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [checkAdmin])

  const refreshAuth = useCallback(async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await checkAdmin(session.user.id)
      } else {
        setUser(null)
        setIsAdmin(false)
      }
    } finally {
      setIsLoading(false)
    }
  }, [checkAdmin])

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  )
}
