'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

const navLinks = [
  { href: '/', label: 'Trang chủ' },
  { href: '/gioi-thieu', label: 'Giới thiệu' },
  { href: '/thuc-pham', label: 'Thực phẩm' },
]

export default function Header({ user }: { user: unknown }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="border-b">
      <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold cursor-pointer">UniTEA</Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex gap-6">
          {navLinks.map(link => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`hover:text-primary transition-colors cursor-pointer ${
                  pathname === link.href ? 'text-primary font-medium' : ''
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Auth buttons */}
        <div className="hidden md:flex gap-3">
          {user ? (
            <>
              <Link href="/chat" className="px-4 py-2 text-sm border rounded hover:bg-gray-50 cursor-pointer transition-colors">
                Chat
              </Link>
              <Link href="/admin" className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800 cursor-pointer transition-colors">
                Admin
              </Link>
            </>
          ) : (
            <Link href="/login" className="px-4 py-2 text-sm bg-black text-white rounded cursor-pointer transition-colors">
              Đăng nhập
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button className="md:hidden cursor-pointer p-1" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t px-4 py-4 flex flex-col gap-3">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="cursor-pointer">
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/chat" className="cursor-pointer">Chat</Link>
              <Link href="/admin" className="cursor-pointer">Admin</Link>
            </>
          ) : (
            <Link href="/login" className="cursor-pointer">Đăng nhập</Link>
          )}
        </div>
      )}
    </header>
  )
}
