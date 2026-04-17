'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, formatTime } from '@/lib/utils'
import StarRating from '@/components/reviews/StarRating'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Coffee,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Star,
} from 'lucide-react'

type OrderFood = {
  name: string
  price: number
  image_url: string | null
  slug?: string
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

type Review = {
  id: string
  order_id: string
  food_id: string
  rating: number
  comment: string | null
  admin_reply: string | null
  admin_replied_at: string | null
  created_at: string
}

export default function HistoryClient({
  userId,
  initialOrders = [],
  initialReviews = [],
}: {
  userId: string
  initialOrders?: Order[]
  initialReviews?: Review[]
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [reviewsByOrderId, setReviewsByOrderId] = useState<Record<string, Review>>(
    initialReviews.reduce<Record<string, Review>>((acc, review) => {
      acc[review.order_id] = review
      return acc
    }, {})
  )
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { rating: number; comment: string }>>({})
  const [reviewSubmittingId, setReviewSubmittingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(initialOrders.length === 0)
  const [fetchError, setFetchError] = useState(false)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const fetchUserOrders = useCallback(async (uid: string, silent = false) => {
    if (!silent) setLoading(true)
    setFetchError(false)

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          food:foods(name, price, image_url, slug)
        `)
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      if (error) throw error

      const fetchedOrders = (data as unknown as Order[]) ?? []
      setOrders(fetchedOrders)

      const orderIds = fetchedOrders.map((order) => order.id)
      if (orderIds.length === 0) {
        setReviewsByOrderId({})
        return
      }

      try {
        const { data: reviews, error: reviewsError } = await supabase
          .from('food_reviews')
          .select('id, order_id, food_id, rating, comment, admin_reply, admin_replied_at, created_at')
          .in('order_id', orderIds)

        if (reviewsError) throw reviewsError

        setReviewsByOrderId(
          ((reviews as unknown as Review[]) ?? []).reduce<Record<string, Review>>((acc, review) => {
            acc[review.order_id] = review
            return acc
          }, {})
        )
      } catch (reviewErr) {
        console.error('[HistoryClient] Failed to load reviews:', reviewErr)
        setReviewsByOrderId({})
      }
    } catch (err) {
      console.error('[HistoryClient] Failed to load orders:', err)
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (initialOrders.length === 0) {
      fetchUserOrders(userId)
    }

    const ordersChannel = supabase
      .channel(`history-orders-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchUserOrders(userId, true)
        }
      )
      .subscribe()

    const reviewsChannel = supabase
      .channel(`history-reviews-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'food_reviews',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchUserOrders(userId, true)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ordersChannel)
      supabase.removeChannel(reviewsChannel)
    }
  }, [fetchUserOrders, initialOrders.length, supabase, userId])

  function getStatusBadge(status: Order['status']) {
    switch (status) {
      case 'pending':
        return <span className="badge bg-yellow-100 text-yellow-700 border-yellow-200">Chờ xác nhận</span>
      case 'confirmed':
        return <span className="badge bg-blue-100 text-blue-700 border-blue-200">Đang chuẩn bị</span>
      case 'completed':
        return <span className="badge bg-green-100 text-green-700 border-green-200">Đã hoàn thành</span>
      case 'cancelled':
        return <span className="badge bg-red-100 text-red-700 border-red-200">Đã hủy</span>
    }
  }

  function updateReviewDraft(orderId: string, patch: Partial<{ rating: number; comment: string }>) {
    setReviewDrafts((prev) => ({
      ...prev,
      [orderId]: {
        rating: prev[orderId]?.rating ?? 5,
        comment: prev[orderId]?.comment ?? '',
        ...patch,
      },
    }))
  }

  async function submitReview(order: Order) {
    const draft = reviewDrafts[order.id] ?? { rating: 5, comment: '' }
    setReviewSubmittingId(order.id)

    try {
      const response = await fetch('/api/reviews/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          rating: draft.rating,
          comment: draft.comment.trim() || null,
        }),
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Không thể gửi đánh giá lúc này.')
      }

      setReviewsByOrderId((prev) => ({
        ...prev,
        [order.id]: payload.review as Review,
      }))
      setReviewDrafts((prev) => {
        const next = { ...prev }
        delete next[order.id]
        return next
      })
    } catch (err) {
      console.error('[HistoryClient] Failed to submit review:', err)
      alert(err instanceof Error ? err.message : 'Không thể gửi đánh giá lúc này.')
    } finally {
      setReviewSubmittingId(null)
    }
  }

  if (loading) {
    return (
      <div className="page-container py-12 sm:py-16 min-h-[calc(100vh-100px)]">
        <div className="max-w-4xl mx-auto">
          <HistoryHeader />
          <div className="text-center py-20 bg-surface-card rounded-3xl border border-gold/10">
            <Loader2 size={32} className="mx-auto text-gold animate-spin mb-4" />
            <p className="text-text-muted">Đang tải lịch sử...</p>
          </div>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="page-container py-12 sm:py-16 min-h-[calc(100vh-100px)]">
        <div className="max-w-4xl mx-auto text-center py-24">
          <p className="text-text-muted mb-4">Không thể tải đơn hàng. Vui lòng thử lại.</p>
          <button
            onClick={() => fetchUserOrders(userId)}
            className="btn-secondary inline-flex items-center gap-2 rounded-full"
          >
            <RefreshCw size={16} />
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container py-12 sm:py-16 min-h-[calc(100vh-100px)]">
      <div className="max-w-4xl mx-auto animate-fade-in-up">
        <HistoryHeader />

        {orders.length === 0 ? (
          <div className="text-center py-24 bg-surface-card rounded-3xl border border-gold/10 border-dashed">
            <Coffee size={48} className="mx-auto text-gold/50 mb-4 opacity-80" />
            <h3 className="text-xl font-display font-bold text-primary mb-2">Không có đơn hàng nào</h3>
            <p className="text-sm text-text-muted mb-6">Hãy đặt món đầu tiên để trải nghiệm dịch vụ.</p>
            <Link href="/thuc-pham" className="btn-primary inline-flex rounded-full">
              Khám phá thực đơn
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
              const review = reviewsByOrderId[order.id]
              const draft = reviewDrafts[order.id] ?? { rating: 5, comment: '' }
              const canReview = order.status === 'completed' && !review

              return (
                <div key={order.id} data-testid="history-order-card" data-order-id={order.id} className="card-base p-5 sm:p-6 space-y-5 hover:shadow-luxury transition-all duration-300">
                  <div className="flex flex-col md:flex-row gap-5 items-start md:items-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-cream-dark rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-border-subtle">
                      {order.food?.image_url ? (
                        <div className="relative w-full h-full">
                          <Image src={order.food.image_url} alt="Món" fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <Coffee size={24} className="text-gold/40" />
                      )}
                    </div>

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

                      <h3 className="text-lg font-bold text-primary leading-tight">
                        {order.quantity}x{' '}
                        <span className="font-display font-semibold">
                          {order.food?.name || 'Món ăn đã bị xóa'}
                        </span>
                      </h3>

                      <div className="flex items-end justify-between pt-2">
                        <div className="text-text-muted text-sm space-y-1">
                          {order.note && (
                            <div className="text-sm">
                              <span className="font-medium text-text-secondary">Ghi chú: </span>
                              <span className="italic">&quot;{order.note}&quot;</span>
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

                  {(review || canReview) && (
                    <div className="border-t border-border-subtle pt-4">
                      {review ? (
                        <div className="space-y-3 rounded-2xl bg-cream/40 border border-gold/10 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-primary">Đánh giá của bạn</p>
                              <p className="text-[11px] text-text-muted">
                                {new Date(review.created_at).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                            <StarRating value={review.rating} />
                          </div>

                          {review.comment && <p className="text-sm text-text-secondary">{review.comment}</p>}

                          {review.admin_reply && (
                            <div className="rounded-xl bg-white border border-border-subtle p-3">
                              <p className="text-xs font-semibold text-gold uppercase tracking-wider mb-1">Cửa hàng phản hồi</p>
                              <p className="text-sm text-primary">{review.admin_reply}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 rounded-2xl bg-white border border-border-subtle p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-primary">Đánh giá món này</p>
                              <p className="text-xs text-text-muted">Đơn đã hoàn thành. Đánh giá sẽ hiển thị dưới trang sản phẩm.</p>
                            </div>
                            {order.food?.slug && (
                              <Link href={`/thuc-pham/${order.food.slug}`} className="text-xs font-medium text-gold hover:underline">
                                Xem trang sản phẩm
                              </Link>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {Array.from({ length: 5 }, (_, index) => {
                              const value = index + 1
                              return (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => updateReviewDraft(order.id, { rating: value })}
                                  className={`text-2xl ${draft.rating >= value ? 'text-yellow-500' : 'text-gray-300'}`}
                                  aria-label={`${value} sao`}
                                >
                                  ★
                                </button>
                              )
                            })}
                          </div>

                          <textarea
                            data-testid="review-comment"
                            value={draft.comment}
                            onChange={(event) => updateReviewDraft(order.id, { comment: event.target.value })}
                            placeholder="Món có đúng kỳ vọng không? Hương vị, đóng gói, thời gian giao..."
                            className="input-field resize-none min-h-[96px]"
                            maxLength={1000}
                          />

                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => void submitReview(order)}
                              disabled={reviewSubmittingId === order.id}
                              data-testid="submit-review"
                              className="btn-primary inline-flex items-center gap-2"
                            >
                              {reviewSubmittingId === order.id ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
                              <span>{reviewSubmittingId === order.id ? 'Đang gửi...' : 'Gửi đánh giá'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function HistoryHeader() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-primary flex items-center gap-3">
          <ShoppingBag size={28} className="text-gold" />
          Lịch sử đơn hàng
        </h1>
        <p className="text-sm text-text-muted mt-2">
          Các đơn hàng sẽ tự động cập nhật trạng thái khi quán chuẩn bị xong.
        </p>
      </div>
      <Link href="/thuc-pham" className="btn-secondary flex items-center gap-2 rounded-full text-sm">
        <ArrowLeft size={16} />
        Tiếp tục đặt món
      </Link>
    </div>
  )
}
