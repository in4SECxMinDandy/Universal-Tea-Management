'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatTime, formatPrice } from '@/lib/utils'
import { ShoppingBag, Loader2, CheckCircle2, ArrowLeft, Clock, Search, Coffee } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type OrderFood = {
  name: string
  price: number
  image_url: string | null
}

type Order = {
  id: string
  user_id: string
  food_id: string
  quantity: number
  note: string | null
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  total_price: number
  created_at: string
  food?: OrderFood | null
}

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/login?redirect=history')
        return
      }
      setUserId(session.user.id)
      await fetchUserOrders(session.user.id)
    }
    
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!userId) return

    // Đăng ký nghe realtime thay đổi của đơn hàng thuộc về user này
    const channel = supabase.channel(`user-orders-${userId}`)
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `user_id=eq.${userId}` 
        }, 
        () => {
          fetchUserOrders(userId)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  async function fetchUserOrders(uid: string) {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        food:foods(name, price, image_url)
      `)
      .eq('user_id', uid)
      .order('created_at', { ascending: false })

    if (data) {
      setOrders(data as unknown as Order[])
    }
    setLoading(false)
  }

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
            Chờ xác nhận
          </span>
        )
      case 'confirmed': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Đang chuẩn bị
          </span>
        )
      case 'completed': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
            <CheckCircle2 size={12} />
            Đã hoàn thành
          </span>
        )
      case 'cancelled': 
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
            Hủy / Từ chối
          </span>
        )
      default: return null
    }
  }

  if (!userId) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-gold" />
      </div>
    )
  }

  return (
    <div className="page-container py-12 sm:py-16 min-h-[calc(100vh-100px)]">
      <div className="max-w-4xl mx-auto animate-fade-in-up">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-primary flex items-center gap-3">
              <ShoppingBag size={28} className="text-gold" />
              Lịch sử đơn hàng
            </h1>
            <p className="text-sm text-text-muted mt-2">
              Các đơn hàng sẽ tự động cập nhật trạng thái khi quán chuẩn bị xong!
            </p>
          </div>
          <Link href="/thuc-pham" className="btn-secondary flex items-center gap-2 rounded-full text-sm">
            <ArrowLeft size={16} />
            Tiếp tục đặt món
          </Link>
        </div>

        {loading && orders.length === 0 ? (
          <div className="text-center py-20 bg-surface-card rounded-3xl border border-gold/10">
            <Loader2 size={32} className="mx-auto text-gold animate-spin mb-4" />
            <p className="text-text-muted">Đang tải lịch sử...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 bg-surface-card rounded-3xl border border-gold/10 border-dashed">
            <Coffee size={48} className="mx-auto text-gold/50 mb-4 opacity-80" />
            <h3 className="text-xl font-display font-bold text-primary mb-2">Chưa có đơn hàng nào</h3>
            <p className="text-sm text-text-muted mb-6">Hãy đặt món đầu tiên để trải nghiệm dịch vụ và đồ uống tuyệt vời!</p>
            <Link href="/thuc-pham" className="btn-primary inline-flex rounded-full">
              Khám phá thực đơn
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map(order => (
              <div 
                key={order.id} 
                className="card-base p-5 sm:p-6 flex flex-col md:flex-row gap-5 items-start md:items-center hover:shadow-luxury transition-all duration-300"
              >
                {/* Phần hiển thị ảnh nhỏ của món ăn nếu có */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-cream-dark rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-border-subtle">
                  {order.food?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={order.food.image_url} alt="Món" className="w-full h-full object-cover" />
                  ) : (
                    <Coffee size={24} className="text-gold/40" />
                  )}
                </div>

                {/* Thông tin đơn hàng */}
                <div className="flex-1 space-y-2.5 w-full">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-text-muted bg-gray-100/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        #{order.id.split('-')[0]}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <span className="text-xs text-text-muted flex items-center gap-1.5 opacity-80">
                      <Clock size={12} />
                      {formatTime(order.created_at)}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-primary leading-tight">
                      {order.quantity}x <span className="font-display font-semibold hover:text-gold transition-colors">{order.food?.name || 'Món ăn đã bị xóa'}</span>
                    </h3>
                  </div>

                  <div className="flex items-end justify-between pt-2">
                    <div className="text-text-muted text-sm space-y-1">
                      {order.note && (
                        <div className="text-sm">
                          <span className="font-medium text-text-secondary">Ghi chú: </span>
                          <span className="italic">"{order.note}"</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <p className="text-[11px] text-text-muted uppercase tracking-wider font-semibold mb-0.5">Tổng tiền</p>
                      <span className="text-xl font-display font-bold text-gold">
                        {formatPrice(order.total_price)}
                      </span>
                    </div>
                  </div>
                </div>
                
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
