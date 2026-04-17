'use client'

import { usePathname } from 'next/navigation'

import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')

  return (
    <>
      {!isAdminRoute ? <Header /> : null}
      <main>{children}</main>
      {!isAdminRoute ? <Footer /> : null}
    </>
  )
}
