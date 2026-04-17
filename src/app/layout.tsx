import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { AuthProvider } from '@/contexts/AuthContext'
import { ReactQueryProvider } from '@/lib/react-query/provider'

export const metadata: Metadata = {
  title: 'universaltea — Trà Sữa & Bánh Ngọt Cao Cấp',
  description: 'Thưởng thức trà sữa thượng hạng và bánh ngọt tinh tế, giao tận nơi',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <ReactQueryProvider>
          <AuthProvider>
            <Header />
            <main>{children}</main>
            <Footer />
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}
