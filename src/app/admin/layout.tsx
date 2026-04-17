'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useMemo, useState } from 'react'
import {
  LayoutDashboard,
  BarChart3,
  UtensilsCrossed,
  MessageCircle,
  Tag,
  Settings,
  LogOut,
  ShoppingBag,
  Star,
  TrendingUp,
  Menu,
  X,
} from 'lucide-react'
import { withTimeout } from '@/lib/utils'

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
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<UserProfile | null>(null)
  const [openChatCount, setOpenChatCount] = useState(0)
  const [pendingOrderCount, setPendingOrderCount] = useState(0)
  const [pendingReviewCount, setPendingReviewCount] = useState(0)
  const [loggingOut, setLoggingOut] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

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
  }, [supabase])

  useEffect(() => {
    async function loadCounts() {
      const [
        { count: chatCount },
        { count: orderCount },
        { count: reviewCount }
      ] = await Promise.all([
        supabase
          .from('chat_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'open'),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('food_reviews')
          .select('id', { count: 'exact', head: true })
          .is('admin_reply', null)
      ])
      setOpenChatCount(chatCount ?? 0)
      setPendingOrderCount(orderCount ?? 0)
      setPendingReviewCount(reviewCount ?? 0)
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
    const reviewSub = supabase
      .channel('admin-layout-review-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'food_reviews' }, () => { loadCounts() })
      .subscribe()
    return () => { 
      supabase.removeChannel(chatSub)
      supabase.removeChannel(orderSub)
      supabase.removeChannel(reviewSub)
    }
  }, [supabase])

  useEffect(() => {
    setIsMobileNavOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isMobileNavOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobileNavOpen])

  async function handleSignOut() {
    if (!confirm('Đăng xuất khỏi Admin Panel?')) return
    setLoggingOut(true)
    try {
      await withTimeout(fetch('/api/auth/logout', { method: 'POST' }), 5000, 'Dang xuat qua lau.')
    } catch (err) {
      console.error(err)
    }

    try {
      await withTimeout(supabase.auth.signOut({ scope: 'local' }), 3000, 'Khong the xoa phien cuc bo.')
    } catch (err) {
      console.error(err)
    } finally {
      window.location.assign('/login')
    }
  }

  const adminLinks: AdminNavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/sales-dashboard', label: 'Bán hàng', icon: TrendingUp },
    { href: '/admin/revenue', label: 'Doanh thu', icon: BarChart3 },
    { href: '/admin/orders', label: 'Đơn hàng', icon: ShoppingBag, badge: pendingOrderCount > 0 ? pendingOrderCount : undefined },
    { href: '/admin/foods', label: 'Quản lý món', icon: UtensilsCrossed },
    { href: '/admin/categories', label: 'Phân loại', icon: Tag },
    { href: '/admin/reviews', label: 'Đánh giá', icon: Star, badge: pendingReviewCount > 0 ? pendingReviewCount : undefined },
    { href: '/admin/chat', label: 'Chat', icon: MessageCircle, badge: openChatCount > 0 ? openChatCount : undefined },
  ]

  function isLinkActive(href: string) {
    return pathname === href || (href !== '/admin' && pathname.startsWith(href))
  }

  const activeLink = adminLinks.find((link) => isLinkActive(link.href))

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] ?? 'A').toUpperCase()

  return (
    <>
      {/* Khung bao bọc toàn bộ bố cục trang quản trị Admin */}
      <div className="min-h-screen bg-surface-bg lg:flex">
        <div className="sticky top-0 z-40 border-b border-border-subtle bg-surface-card/95 backdrop-blur lg:hidden">
          <div className="page-container flex items-center justify-between py-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-text-muted">Admin Panel</p>
              <p className="truncate text-sm font-semibold text-primary">{activeLink?.label ?? 'Dashboard'}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border-subtle bg-white text-primary shadow-card-base focus-ring"
              aria-label="Mở menu quản trị"
              aria-controls="admin-mobile-nav"
              aria-expanded={isMobileNavOpen}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        {/* --- Cột Bên Trái: Thanh điều hướng dọc (Sidebar) --- */}
        <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col overflow-y-auto border-r border-border-subtle bg-surface-card lg:flex">
          <AdminSidebarContent
            adminLinks={adminLinks}
            isLinkActive={isLinkActive}
            user={user}
            initials={initials}
            loggingOut={loggingOut}
            onSignOut={handleSignOut}
          />
        </aside>

        {isMobileNavOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              className="absolute inset-0 bg-primary/35 backdrop-blur-[2px]"
              aria-label="Đóng menu quản trị"
            />

            <aside
              id="admin-mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label="Điều hướng quản trị"
              className="absolute inset-y-0 left-0 flex w-[min(20rem,calc(100vw-1.5rem))] max-w-full flex-col overflow-y-auto border-r border-border-subtle bg-surface-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border-subtle px-6 py-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <Settings size={14} className="text-white" />
                  </div>
                  <span className="text-base font-bold text-primary">Admin Panel</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border-subtle bg-white text-primary focus-ring"
                  aria-label="Đóng menu"
                >
                  <X size={18} />
                </button>
              </div>

              <AdminSidebarContent
                adminLinks={adminLinks}
                isLinkActive={isLinkActive}
                user={user}
                initials={initials}
                loggingOut={loggingOut}
                onSignOut={handleSignOut}
                onNavigate={() => setIsMobileNavOpen(false)}
                showBrand={false}
              />
            </aside>
          </div>
        ) : null}

        {/* --- Cột Bên Phải: Khu vực Nội dung (Content) --- */}
        <div className="flex-1 min-w-0">
          <div className="page-container py-6 lg:py-8">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

function AdminSidebarContent({
  adminLinks,
  isLinkActive,
  user,
  initials,
  loggingOut,
  onSignOut,
  onNavigate,
  showBrand = true,
}: {
  adminLinks: AdminNavItem[]
  isLinkActive: (href: string) => boolean
  user: UserProfile | null
  initials: string
  loggingOut: boolean
  onSignOut: () => void
  onNavigate?: () => void
  showBrand?: boolean
}) {
  return (
    <>
      {showBrand ? (
        <div className="border-b border-border-subtle px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Settings size={14} className="text-white" />
            </div>
            <span className="text-base font-bold text-primary">Admin Panel</span>
          </div>
        </div>
      ) : null}

      <nav className="flex-1 space-y-1 px-3 py-4">
        {adminLinks.map((link) => {
          const isActive = isLinkActive(link.href)
          const Icon = link.icon

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
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
              {link.badge !== undefined ? (
                <span className={`
                  ml-auto flex min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold h-5
                  ${isActive ? 'bg-white/20 text-white' : 'bg-accent-red text-white'}
                `}>
                  {link.badge > 99 ? '99+' : link.badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-3 border-t border-border-subtle px-3 py-4">
        {user ? (
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-primary">{user.full_name || 'Admin'}</p>
              <p className="truncate text-[11px] text-text-muted">{user.email}</p>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onSignOut}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-accent-red hover:bg-red-50 cursor-pointer transition-all duration-150 disabled:opacity-50"
        >
          <LogOut size={18} />
          <span>{loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
        </button>

        <Link
          href="/home"
          onClick={onNavigate}
          className="flex items-center gap-2 px-3 text-xs text-text-muted hover:text-primary cursor-pointer transition-colors duration-150"
        >
          ← Quay lại cửa hàng
        </Link>
      </div>
    </>
  )
}
