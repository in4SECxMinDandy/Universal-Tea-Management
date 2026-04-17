import type { Metadata } from 'next'

import { RevenueDashboard } from '@/components/admin/revenue-dashboard/RevenueDashboard'

export const metadata: Metadata = {
  title: 'Dashboard bán hàng | Admin Panel',
  description: 'Trang tổng hợp doanh thu, sản phẩm bán chạy và đánh giá tiêu cực cho quản lý cửa hàng.',
}

export default function AdminSalesDashboardPage() {
  return <RevenueDashboard />
}
