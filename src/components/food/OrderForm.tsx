'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Minus, Plus, Loader2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

type OrderFormProps = {
  foodId: string
  price: number
  isAvailable: boolean
  userId: string | null
}

export default function OrderForm({ foodId, price, isAvailable, userId }: OrderFormProps) {
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const increment = () => setQuantity(prev => (prev < 99 ? prev + 1 : prev))
  const decrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1))

  const handleOrder = async () => {
    if (!userId) {
      router.push('/login?redirect=order')
      return
    }

    if (!isAvailable) return

    setIsSubmitting(true)
    setMessage(null)

    try {
      const { error } = await supabase.from('orders').insert({
        user_id: userId,
        food_id: foodId,
        quantity,
        note: note.trim() || null,
        total_price: price * quantity
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Đặt hàng thành công! Xem tiến độ tại trang Lịch sử đơn hàng.' })
      setQuantity(1)
      setNote('')
    } catch (err: any) {
      console.error('Order error:', err)
      setMessage({ type: 'error', text: 'Đặt hàng thất bại. Vui lòng thử lại sau.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-xl text-sm border flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in ${
          message.type === 'success' 
            ? 'bg-accent-green-light border-accent-green/20 text-accent-green' 
            : 'bg-accent-red-light border-accent-red/20 text-accent-red'
        }`}>
          <span>{message.text}</span>
          {message.type === 'success' && (
            <button
              onClick={() => router.push('/history')}
              className="text-accent-green hover:text-accent-green-dark underline font-medium whitespace-nowrap text-left"
            >
              Tới Lịch sử
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4 p-6 rounded-2xl bg-white border border-border-subtle shadow-card-base">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-primary">Số lượng</label>
          <div className="flex items-center gap-1 bg-cream border border-border-subtle rounded-full p-1">
            <button 
              type="button"
              onClick={decrement}
              disabled={quantity <= 1 || isSubmitting}
              className="p-2 text-text-muted hover:text-gold disabled:opacity-50 transition-colors rounded-full hover:bg-white"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
            <button 
              type="button"
              onClick={increment}
              disabled={quantity >= 99 || isSubmitting}
              className="p-2 text-text-muted hover:text-gold disabled:opacity-50 transition-colors rounded-full hover:bg-white"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-primary flex justify-between">
            <span>Ghi chú</span>
            <span className="text-xs text-text-muted font-normal">VD: Ít đá, nhiều sữa</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isSubmitting}
            placeholder="Nhập ghi chú cho quán..."
            className="w-full input-field resize-none min-h-[80px]"
            maxLength={500}
          />
        </div>

        <div className="pt-4 border-t border-border-subtle flex justify-between items-center">
          <span className="text-sm text-text-secondary font-medium">Tạm tính:</span>
          <span className="text-xl font-display font-bold text-gold">{formatPrice(price * quantity)}</span>
        </div>
      </div>

      <button
        onClick={handleOrder}
        disabled={!isAvailable || isSubmitting}
        className="btn-primary w-full flex items-center justify-center gap-2 py-4 rounded-full shadow-button-glow disabled:shadow-none text-base"
      >
        {isSubmitting ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <ShoppingCart size={18} />
        )}
        <span>{!userId ? 'Đăng nhập để Đặt hàng' : isSubmitting ? 'Đang xử lý...' : 'Xác nhận Đặt hàng'}</span>
      </button>
    </div>
  )
}
