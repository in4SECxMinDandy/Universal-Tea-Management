'use client'
import { RoleGate } from '@/components/auth/RoleGate'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { LayoutDashboard, UtensilsCrossed, MessageCircle, Tag, Settings, LogOut, ShoppingBag } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  full_name: string
}

interface AdminNavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  badge?: number
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const supabase = createClient()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [openChatCount, setOpenChatCount] = useState(0)
  const [pendingOrderCount, setPendingOrderCount] = useState(0)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession()
      const authUser = session?.user
      if (!authUser) return
      // profiles table does not have an email column — use auth.email instead
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', authUser.id)
        .single()
      setUser({
        id: authUser.id,
        email: authUser.email ?? '',
        full_name: profile?.full_name ?? authUser.user_metadata?.full_name ?? authUser.email ?? 'Admin',
      })
    }
    loadUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- supabase stable per component instance
  }, [])

  useEffect(() => {
    async function loadCounts() {
      const [
        { count: chatCount },
        { count: orderCount }
      ] = await Promise.all([
        supabase
          .from('chat_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open'),
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
      ])
      setOpenChatCount(chatCount ?? 0)
      setPendingOrderCount(orderCount ?? 0)
    }
    loadCounts()

    const chatSub = supabase
      .channel('admin-layout-chat-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_sessions' }, () => { loadCounts() })
      .subscribe()
    const orderSub = supabase
      .channel('admin-layout-order-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => { loadCounts() })
      .subscribe()
    return () => { 
      supabase.removeChannel(chatSub)
      supabase.removeChannel(orderSub)
    }
  }, [])

  async function handleSignOut() {
    if (!confirm('Đăng xuất khỏi Admin Panel?')) return
    setLoggingOut(true)
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const adminLinks: AdminNavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Đơn hàng', icon: ShoppingBag, badge: pendingOrderCount > 0 ? pendingOrderCount : undefined },
    { href: '/admin/foods', label: 'Quản lý món', icon: UtensilsCrossed },
    { href: '/admin/categories', label: 'Phân loại', icon: Tag },
    { href: '/admin/chat', label: 'Chat', icon: MessageCircle, badge: openChatCount > 0 ? openChatCount : undefined },
  ]

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] ?? 'A').toUpperCase()

  return (
    <RoleGate role="STORE_ADMIN">
      <div className="flex min-h-screen bg-surface-bg">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 border-r border-border-subtle bg-surface-card sticky top-0 h-screen overflow-y-auto flex flex-col">
          {/* Logo */}
          <div className="px-6 py-5 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Settings size={14} className="text-white" />
              </div>
              <span className="text-base font-bold text-primary">Admin Panel</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="px-3 py-4 space-y-1 flex-1">
            {adminLinks.map(link => {
              const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer
                    transition-all duration-150
                    ${isActive
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-primary hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon size={18} />
                  <span>{link.label}</span>
                  {link.badge !== undefined && (
                    <span className={`
                      ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold
                      ${isActive ? 'bg-white/20 text-white' : 'bg-accent-red text-white'}
                    `}>
                      {link.badge > 99 ? '99+' : link.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User info + logout */}
          <div className="px-3 py-4 border-t border-border-subtle space-y-3">
            {user && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">{user.full_name || 'Admin'}</p>
                  <p className="text-[11px] text-text-muted truncate">{user.email}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleSignOut}
              disabled={loggingOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-accent-red hover:bg-red-50 cursor-pointer transition-all duration-150 disabled:opacity-50"
            >
              <LogOut size={18} />
              <span>{loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
            </button>

            <Link
              href="/"
              className="flex items-center gap-2 text-xs text-text-muted hover:text-primary cursor-pointer transition-colors duration-150 px-3"
            >
              ← Quay lại cửa hàng
            </Link>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="page-container py-8">
            {children}
          </div>
        </div>
      </div>
    </RoleGate>
  )
}