import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'UniTEA — Trà Sữa & Bánh Ngọt Cao Cấp',
  description: 'Thưởng thức trà sữa thượng hạng và bánh ngọt tinh tế, giao tận nơi',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let isAdmin = false
  if (user) {
    const { data } = await supabase.rpc('has_role', { uid: user.id, role_name: 'STORE_ADMIN' })
    isAdmin = data === true
  }

  return (
    <html lang="vi">
      <body>
        <Header user={user} isAdmin={isAdmin} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
