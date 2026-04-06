'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, MessageCircle, Settings, LogOut, ChevronDown, ShoppingBag } from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Trang chủ' },
  { href: '/gioi-thieu', label: 'Giới thiệu' },
  { href: '/thuc-pham', label: 'Thực đơn' },
]

export default function Header({ user, isAdmin }: { user: unknown; isAdmin?: boolean }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const supabase = createClient()
  const userRecord = user as { id?: string; email?: string; user_metadata?: { full_name?: string } } | null

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border-subtle/50 transition-all duration-500">
      <nav className="page-container">
        <div className="flex items-center justify-between h-[72px]">
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center transition-all duration-300 group-hover:shadow-gold-glow">
              <span className="text-white font-display font-bold text-sm">U</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-display font-bold text-primary tracking-tight leading-tight">
                UniTEA
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-gold font-medium leading-tight">
                Tea & Bakery
              </span>
            </div>
          </Link>

          <ul className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`
                      relative px-5 py-2 rounded-full text-sm font-medium cursor-pointer
                      transition-all duration-300 ease-luxury
                      ${isActive
                        ? 'text-gold'
                        : 'text-text-secondary hover:text-primary'
                      }
                    `}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-gold rounded-full" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {!isAdmin && (
                  <Link
                    href="/chat"
                    className={`
                      flex items-center gap-1.5 px-3 py-2 text-sm rounded-full cursor-pointer
                      transition-all duration-300
                      ${pathname === '/chat'
                        ? 'text-gold bg-gold/5'
                        : 'text-text-secondary hover:text-gold hover:bg-gold/5'
                      }
                    `}
                  >
                    <MessageCircle size={16} />
                    <span>Chat</span>
                  </Link>
                )}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-3 pr-2 py-2 text-sm rounded-full cursor-pointer transition-all duration-300 text-text-secondary hover:text-primary hover:bg-cream-dark"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
                      <span className="text-xs font-bold text-gold">
                        {(userRecord?.user_metadata?.full_name ?? 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="max-w-[100px] truncate font-medium">
                      {userRecord?.user_metadata?.full_name ?? 'User'}
                    </span>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 card-base shadow-luxury border border-border-subtle py-2 z-50 animate-scale-in">
                      {isAdmin && (
                        <>
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-gold hover:bg-gold/5 cursor-pointer transition-colors duration-200"
                          >
                            <Settings size={14} />
                            <span>Quản trị</span>
                          </Link>
                          <div className="border-t border-border-subtle my-1" />
                        </>
                      )}
                      <Link
                        href="/history"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-gold hover:bg-gold/5 cursor-pointer transition-colors duration-200"
                      >
                        <ShoppingBag size={14} />
                        <span>Đơn hàng của tôi</span>
                      </Link>
                      <div className="border-t border-border-subtle my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-accent-red hover:bg-accent-red-light/30 cursor-pointer transition-colors duration-200"
                      >
                        <LogOut size={14} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link href="/login" className="btn-primary text-sm py-2.5 px-6 rounded-full">
                Đăng nhập
              </Link>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-full hover:bg-cream-dark cursor-pointer transition-colors duration-200 focus-ring"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X size={20} className="text-primary" />
            ) : (
              <Menu size={20} className="text-primary" />
            )}
          </button>
        </div>
      </nav>

      <div
        className={`
          md:hidden overflow-hidden transition-all duration-500 ease-luxury
          ${mobileOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="border-t border-border-subtle px-4 py-4 space-y-1 bg-white">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center px-4 py-3 rounded-xl text-sm font-medium cursor-pointer
                  transition-colors duration-200
                  ${isActive
                    ? 'text-gold bg-gold/5'
                    : 'text-text-secondary hover:text-gold hover:bg-gold/5'
                  }
                `}
              >
                {link.label}
              </Link>
            )
          })}
          <div className="pt-3 border-t border-border-subtle mt-3">
            {user ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 px-4 py-3 mb-1">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-gold">
                      {(userRecord?.user_metadata?.full_name ?? 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary truncate">
                      {userRecord?.user_metadata?.full_name ?? 'User'}
                    </p>
                    <p className="text-xs text-text-muted truncate">{userRecord?.email}</p>
                  </div>
                </div>
                {!isAdmin && (
                  <Link
                    href="/chat"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:text-gold hover:bg-gold/5 cursor-pointer transition-colors duration-200"
                  >
                    <MessageCircle size={16} />
                    <span>Chat</span>
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:text-gold hover:bg-gold/5 cursor-pointer transition-colors duration-200"
                  >
                    <Settings size={16} />
                    <span>Quản trị</span>
                  </Link>
                )}
                <Link
                  href="/history"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:text-gold hover:bg-gold/5 cursor-pointer transition-colors duration-200"
                >
                  <ShoppingBag size={16} />
                  <span>Đơn hàng của tôi</span>
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); handleLogout() }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-accent-red hover:bg-accent-red-light/30 cursor-pointer transition-colors duration-200 w-full text-left"
                >
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gold text-white rounded-full text-sm font-medium cursor-pointer transition-all duration-300 hover:bg-gold-light hover:shadow-button-glow"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
