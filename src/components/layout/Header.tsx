'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, ShoppingBag, MessageCircle, Settings, LogOut, ChevronDown } from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Trang chủ' },
  { href: '/gioi-thieu', label: 'Giới thiệu' },
  { href: '/thuc-pham', label: 'Thực phẩm' },
]

export default function Header({ user }: { user: unknown }) {
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
    <header className="sticky top-0 z-50 bg-surface-card/95 backdrop-blur-sm border-b border-border-subtle transition-all duration-300">
      <nav className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <ShoppingBag size={16} className="text-white" />
            </div>
            <span className="text-xl font-bold text-primary tracking-tight">
              UniTEA
            </span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-1">
            {navLinks.map((link, idx) => {
              const isActive = pathname === link.href
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`
                      relative px-4 py-2 rounded-lg text-sm font-medium cursor-pointer
                      transition-all duration-200 ease-smooth
                      ${isActive
                        ? 'text-primary bg-gray-50'
                        : 'text-text-secondary hover:text-primary hover:bg-gray-50'
                      }
                    `}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/chat"
                  className={`
                    flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg cursor-pointer
                    transition-all duration-200
                    ${pathname === '/chat'
                      ? 'text-primary bg-gray-50'
                      : 'text-text-secondary hover:text-primary hover:bg-gray-50'
                    }
                  `}
                >
                  <MessageCircle size={16} />
                  <span>Chat</span>
                </Link>
                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-3 pr-2 py-2 text-sm rounded-lg cursor-pointer transition-all duration-200 text-text-secondary hover:text-primary hover:bg-gray-50"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        {(userRecord?.user_metadata?.full_name ?? 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="max-w-[100px] truncate font-medium">
                      {userRecord?.user_metadata?.full_name ?? 'User'}
                    </span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 card-base shadow-card-base border border-border-subtle py-1 z-50 animate-scale-in">
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-primary hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                      >
                        <Settings size={14} />
                        <span>Quản trị</span>
                      </Link>
                      <div className="border-t border-border-subtle my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-accent-red hover:bg-accent-red-light/30 cursor-pointer transition-colors duration-150"
                      >
                        <LogOut size={14} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link href="/login" className="btn-primary text-sm py-2 px-5">
                Đăng nhập
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-150 focus-ring"
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

      {/* Mobile nav */}
      <div
        className={`
          md:hidden overflow-hidden transition-all duration-300 ease-smooth
          ${mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="border-t border-border-subtle px-4 py-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer
                  transition-colors duration-150
                  ${isActive
                    ? 'text-primary bg-gray-50'
                    : 'text-text-secondary hover:text-primary hover:bg-gray-50'
                  }
                `}
              >
                {link.label}
              </Link>
            )
          })}
          <div className="pt-2 border-t border-border-subtle mt-2">
            {user ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">
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
                <Link
                  href="/chat"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-primary hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                >
                  <MessageCircle size={16} />
                  <span>Chat</span>
                </Link>
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-primary hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                >
                  <Settings size={16} />
                  <span>Quản trị</span>
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); handleLogout() }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-accent-red hover:bg-accent-red-light/30 cursor-pointer transition-colors duration-150 w-full text-left"
                >
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium cursor-pointer transition-colors duration-150 hover:bg-primary-light"
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
