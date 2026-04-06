'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatTime, formatPrice } from '@/lib/utils'
import { Loader2, Clock, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type OrderFood = {
  name: string
  price: number
  image_url: string | null
}

type Order = {
  id: string
  food_id: string
  quantity: number
  note: string | null
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  total_price: number
  created_at: string
  food?: OrderFood | null
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login?redirect=history')
        return
      }
      
      doFetch()

      channel = supabase.channel(`user-orders-history-${session.user.id}-${Date.now()}`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${session.user.id}` }, 
          () => { doFetch() }
        )
        .subscribe()
    }
    
    async function doFetch() {
      setLoading(true)
      const { data } = await supabase
        .from('orders')
        .select(`*, food:foods(name, price, image_url)`)
        .order('created_at', { ascending: false })
      if (data) setOrders(data as unknown as Order[])
      setLoading(false)
    }

    loadData()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [supabase, router])

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <span className="badge bg-amber-50 text-amber-700 border-amber-200">Đang chờ xác nhận</span>
      case 'confirmed': return <span className="badge bg-blue-50 text-blue-700 border-blue-200">Đang chuẩn bị</span>
      case 'completed': return <span className="badge bg-green-50 text-green-700 border-green-200">Hoàn thành</span>
      case 'cancelled': return <span className="badge bg-red-50 text-red-700 border-red-200">Đã hủy</span>
      default: return null
    }
  }

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gold opacity-50" />
      </div>
    )
  }

  return (
    <div className="page-container py-12 sm:py-16 animate-fade-in">
      <div className="mb-10">
        <div className="gold-line mb-4" />
        <h1 className="section-heading">Đơn Hàng Của Bạn</h1>
        <p className="section-subheading">
          Theo dõi trạng thái và lịch sử đơn hàng
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {orders.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-border-subtle flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-cream-dark flex items-center justify-center mb-4">
              <Search size={24} className="text-text-muted" />
            </div>
            <h3 className="text-xl font-display font-bold text-primary">Chưa có đơn hàng nào</h3>
            <p className="text-text-muted mt-1 mb-6">Bạn chưa đặt món nào tại UniTEA.</p>
            <Link href="/thuc-pham" className="btn-primary rounded-full">
              Khám phá thực đơn
            </Link>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="card-base p-5 sm:p-6 flex flex-col md:flex-row gap-5 items-start md:items-center relative overflow-hidden transition-all duration-500 hover:shadow-card-hover hover:border-gold/20 group">
              <div className="hidden sm:flex flex-shrink-0 w-20 h-20 rounded-2xl bg-cream items-center justify-center overflow-hidden">
                {order.food?.image_url ? (
                  <img src={order.food.image_url} alt={order.food.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">🍵</span>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-text-muted bg-cream px-2.5 py-1 rounded-full">
                    #{order.id.split('-')[0].toUpperCase()}
                  </span>
                  <span className="text-sm text-text-muted flex items-center gap-1">
                    <Clock size={14} />
                    {formatTime(order.created_at)}
                  </span>
                </div>
                
                <div>
                  <h3 className="text-xl font-display font-bold text-primary">
                    {order.quantity}x {order.food?.name || 'Món đã bị xóa'}
                  </h3>
                  <div className="text-sm text-text-secondary mt-1">
                     Tổng tiền: <span className="font-display font-bold text-gold text-base ml-1">{formatPrice(order.total_price)}</span>
                  </div>
                </div>

                {order.note && (
                  <div className="text-sm text-text-muted italic mt-2">
                    <span className="not-italic text-text-secondary font-medium mr-1">Ghi chú:</span> 
                    {order.note}
                  </div>
                )}
              </div>

              <div className="w-full md:w-auto flex justify-between md:flex-col items-center md:items-end gap-3 p-4 md:p-0 bg-cream md:bg-transparent rounded-xl md:rounded-none border md:border-none border-border-subtle border-dashed">
                {getStatusBadge(order.status)}
                
                {order.status === 'pending' && (
                  <p className="text-xs text-text-muted text-right max-w-[150px]">
                    Đơn hàng sẽ sớm được xác nhận.
                  </p>
                )}
                {order.status === 'confirmed' && (
                  <p className="text-xs text-gold text-right font-medium max-w-[150px] flex items-center gap-1 justify-end">
                    <Loader2 size={12} className="animate-spin" /> Đang chuẩn bị...
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
