import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'UniTEA — Cửa hàng đồ ăn',
  description: 'Đặt món ngon, giao tận nơi',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="vi">
      <body>
        <Header user={user} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
