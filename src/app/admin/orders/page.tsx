'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatTime, formatPrice } from '@/lib/utils'
import { ShoppingBag, Loader2, CheckCircle2, XCircle, Clock, Search } from 'lucide-react'

type OrderProfile = {
  full_name: string | null
}

type OrderFood = {
  name: string
  price: number
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
  profiles?: OrderProfile | null
  food?: OrderFood | null
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const fetchOrders = useCallback(async () => {
    // We cannot easily join auth.users via postgREST, but we can join profiles if they share the foreign key id.
    // Let's fetch orders and manually map profiles if needed, or try the postgREST join.
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        profiles!orders_user_id_profiles_fkey(full_name),
        food:foods(name, price)
      `)
      .order('created_at', { ascending: false })

    if (data) {
      setOrders(data as unknown as Order[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchOrders()

    const channel = supabase.channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchOrders, supabase])

  async function updateOrderStatus(id: string, newStatus: Order['status']) {
    setProcessingId(id)
    try {
      await supabase.from('orders').update({ status: newStatus }).eq('id', id)
      // fetchOrders will be called by realtime subscription, or we update locally
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
    } catch (e) {
      console.error(e)
    } finally {
      setProcessingId(null)
    }
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter)

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <span className="badge bg-yellow-100 text-yellow-700 border-yellow-200">Đang chờ</span>
      case 'confirmed': return <span className="badge bg-blue-100 text-blue-700 border-blue-200">Đã xác nhận</span>
      case 'completed': return <span className="badge bg-green-100 text-green-700 border-green-200">Hoàn thành</span>
      case 'cancelled': return <span className="badge bg-red-100 text-red-700 border-red-200">Đã hủy</span>
      default: return null
    }
  }

  if (loading && orders.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 size={32} className="animate-spin text-primary opacity-50" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10 w-full animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <ShoppingBag size={24} />
            Quản lý đơn hàng
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Theo dõi và xử lý các đơn đặt hàng từ khách
          </p>
        </div>

        <div className="flex gap-2 bg-surface-card p-1 rounded-xl border border-border-subtle shadow-sm w-full sm:w-auto overflow-x-auto">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'Tất cả' : 
               f === 'pending' ? 'Chờ xác nhận' : 
               f === 'confirmed' ? 'Đang chuẩn bị' : 
               f === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-surface-card rounded-2xl border border-border-subtle border-dashed">
            <Search size={40} className="mx-auto text-text-muted mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-primary">Không có đơn hàng nào</h3>
            <p className="text-text-muted mt-1">Chưa có đơn hàng nào khớp với điều kiện lọc.</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} data-testid="admin-order-card" data-order-id={order.id} className="card-base p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
              {/* Info section */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-text-muted bg-gray-100 px-2 py-1 rounded select-all">
                    #{order.id.split('-')[0].toUpperCase()}
                  </span>
                  {getStatusBadge(order.status)}
                  <span className="text-sm text-text-muted flex items-center gap-1">
                    <Clock size={14} />
                    {formatTime(order.created_at)}
                  </span>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-primary">
                    {order.quantity}x {order.food?.name || 'Món ăn đã bị xóa'}
                  </h3>
                  <div className="text-sm text-text-secondary mt-1 flex flex-col sm:flex-row gap-2 sm:gap-6">
                    <span className="font-medium text-primary">
                      {formatPrice(order.total_price)}
                    </span>
                    <span className="flex items-center gap-1.5 opacity-80">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      {order.profiles?.full_name || 'Khách hàng'}
                    </span>
                  </div>
                </div>

                {order.note && (
                  <div className="bg-yellow-50/50 border border-yellow-200/50 rounded-lg p-3 text-sm text-yellow-800">
                    <span className="font-semibold text-yellow-900 mr-2">Ghi chú:</span>
                    {order.note}
                  </div>
                )}
              </div>

              {/* Actions section */}
              <div className="flex gap-2 w-full md:w-auto justify-end">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      disabled={processingId === order.id}
                      data-testid="admin-order-cancel"
                      className="btn-secondary px-4 py-2 border-accent-red/20 text-accent-red hover:bg-accent-red-light/30"
                    >
                      Từ chối
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      disabled={processingId === order.id}
                      data-testid="admin-order-confirm"
                      className="btn-primary px-4 py-2 flex items-center gap-2"
                    >
                      {processingId === order.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      <span>Nhận đơn</span>
                    </button>
                  </>
                )}

                {order.status === 'confirmed' && (
                  <>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      disabled={processingId === order.id}
                      data-testid="admin-order-complete"
                      className="btn-primary bg-accent-green hover:bg-accent-green-dark shadow-accent-green/20 px-4 py-2 flex items-center gap-2"
                    >
                      {processingId === order.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      <span>Hoàn thành</span>
                    </button>
                  </>
                )}
                
                {/* Completed and Cancelled usually don't have actions, but maybe delete?
                    We just leave them as non-actionable. */}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
