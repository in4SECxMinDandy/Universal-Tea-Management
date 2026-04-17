'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ADMIN_FOOD_REVIEW_SELECT_FIELDS } from '@/lib/supabase/selects'
import StarRating from '@/components/reviews/StarRating'
import { Loader2, MessageSquareReply, RefreshCw, Star } from 'lucide-react'

type AdminReview = {
  id: string
  order_id: string
  food_id: string
  user_id: string
  reviewer_name: string
  rating: number
  comment: string | null
  admin_reply: string | null
  admin_replied_at: string | null
  created_at: string
  food: {
    id: string
    name: string
    slug: string
    image_url: string | null
  } | null
}

export default function AdminReviewsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [loading, setLoading] = useState(true)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  const loadReviews = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('food_reviews')
      .select(ADMIN_FOOD_REVIEW_SELECT_FIELDS)
      .order('created_at', { ascending: false })

    setReviews((data as unknown as AdminReview[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadReviews()

    const channel = supabase
      .channel('admin-food-reviews')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'food_reviews' }, () => {
        loadReviews()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadReviews, supabase])

  async function saveReply(review: AdminReview) {
    const reply = (replyDrafts[review.id] ?? review.admin_reply ?? '').trim()
    if (!reply) return

    setSavingId(review.id)

    try {
      const response = await fetch('/api/reviews/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_id: review.id,
          reply,
        }),
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Không thể lưu phản hồi.')
      }

      setReviews(prev => prev.map(item => item.id === review.id ? { ...item, ...payload.review } : item))
      setReplyDrafts(prev => ({ ...prev, [review.id]: reply }))
    } catch (err) {
      console.error('[AdminReviews] Failed to save reply:', err)
      alert(err instanceof Error ? err.message : 'Không thể lưu phản hồi.')
    } finally {
      setSavingId(null)
    }
  }

  const pendingCount = reviews.filter(review => !review.admin_reply).length

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
            <Star size={12} />
            <span>Quản lý</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">Đánh giá sản phẩm</h1>
          <p className="text-sm text-text-muted mt-1">
            {reviews.length} đánh giá, {pendingCount} chưa phản hồi
          </p>
        </div>
        <button onClick={loadReviews} className="btn-secondary inline-flex items-center gap-2">
          <RefreshCw size={14} />
          Tải lại
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="text-text-muted animate-spin" />
          <p className="text-sm text-text-muted">Đang tải đánh giá...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="card-base p-12 text-center">
          <MessageSquareReply size={34} className="mx-auto text-text-muted mb-4" />
          <h3 className="text-lg font-semibold text-primary">Chưa có đánh giá nào</h3>
          <p className="text-sm text-text-muted mt-1">Đánh giá sẽ xuất hiện khi khách hoàn thành đơn và gửi phản hồi.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => {
            const replyDraft = replyDrafts[review.id] ?? review.admin_reply ?? ''

            return (
              <article key={review.id} data-testid="admin-review-card" data-review-id={review.id} data-order-id={review.order_id} className="card-base p-5 sm:p-6">
                <div className="flex flex-col lg:flex-row gap-5">
                  <div className="w-full lg:w-64 flex-shrink-0">
                    <div className="flex gap-3">
                      <div className="relative w-16 h-16 rounded-xl bg-gray-100 overflow-hidden border border-border-subtle">
                        {review.food?.image_url ? (
                          <Image src={review.food.image_url} alt={review.food.name} fill className="object-cover" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-muted">No</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-primary truncate">{review.food?.name ?? 'Món đã xóa'}</p>
                        {review.food?.slug && (
                          <Link href={`/thuc-pham/${review.food.slug}`} className="text-xs text-gold hover:underline">
                            Xem sản phẩm
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-primary">{review.reviewer_name}</p>
                        <p className="text-xs text-text-muted">
                          {new Date(review.created_at).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <StarRating value={review.rating} />
                    </div>

                    {review.comment ? (
                      <p className="text-sm text-text-secondary leading-relaxed">{review.comment}</p>
                    ) : (
                      <p className="text-sm text-text-muted italic">Khách không nhập nhận xét.</p>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-primary" htmlFor={`reply-${review.id}`}>
                        Phản hồi của cửa hàng
                      </label>
                      <textarea
                        data-testid="admin-review-reply"
                        id={`reply-${review.id}`}
                        value={replyDraft}
                        onChange={(event) => setReplyDrafts(prev => ({ ...prev, [review.id]: event.target.value }))}
                        placeholder="Cảm ơn bạn đã phản hồi..."
                        className="input-field resize-none min-h-[92px]"
                        maxLength={1000}
                      />
                      <div className="flex justify-between items-center gap-3">
                        <span className="text-xs text-text-muted">
                          {review.admin_replied_at
                            ? `Đã phản hồi lúc ${new Date(review.admin_replied_at).toLocaleString('vi-VN')}`
                            : 'Chưa phản hồi'}
                        </span>
                        <button
                          onClick={() => void saveReply(review)}
                          disabled={savingId === review.id || !replyDraft.trim()}
                          data-testid="admin-review-save"
                          className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
                        >
                          {savingId === review.id ? <Loader2 size={14} className="animate-spin" /> : <MessageSquareReply size={14} />}
                          <span>{savingId === review.id ? 'Đang lưu...' : 'Lưu phản hồi'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
