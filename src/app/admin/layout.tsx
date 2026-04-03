import { RoleGate } from '@/components/auth/RoleGate'
import Link from 'next/link'

const adminLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/foods', label: 'Quản lý món' },
  { href: '/admin/chat', label: 'Chat' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate role="STORE_ADMIN">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r p-4">
          <h2 className="font-bold mb-4">Admin Panel</h2>
          <nav className="flex flex-col gap-2">
            {adminLinks.map(link => (
              <Link key={link.href} href={link.href} className="px-3 py-2 rounded hover:bg-gray-100 cursor-pointer transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex-1 p-6">{children}</div>
      </div>
    </RoleGate>
  )
}
