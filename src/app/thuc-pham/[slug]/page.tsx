import { createClient } from '@/lib/supabase/server'
import { FOOD_SELECT_FIELDS } from '@/lib/supabase/selects'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { ArrowLeft, CheckCircle2, Clock, MessageSquare } from 'lucide-react'
import OrderForm from '@/components/food/OrderForm'
import StarRating from '@/components/reviews/StarRating'

export default async function FoodDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: food } = await supabase
    .from('foods')
    .select(FOOD_SELECT_FIELDS)
    .eq('slug', slug)
    .eq('is_available', true)
    .is('deleted_at', null)
    .single()

  const normalizedFood = food
    ? {
        ...food,
        category: Array.isArray(food.category) ? (food.category[0] ?? null) : food.category,
      }
    : null

  if (!normalizedFood) {
    notFound()
  }

  const { data: { session } } = await supabase.auth.getSession()
  const isAdmin = session?.user
    ? (
        await supabase.rpc('has_role', {
          uid: session.user.id,
          role_name: 'STORE_ADMIN',
        })
      ).data === true
    : false

  const { data: reviews } = await supabase
    .from('food_reviews')
    .select('id, reviewer_name, rating, comment, admin_reply, admin_replied_at, created_at')
    .eq('food_id', normalizedFood.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const visibleReviews = reviews ?? []
  const averageRating = visibleReviews.length > 0
    ? visibleReviews.reduce((sum, review) => sum + review.rating, 0) / visibleReviews.length
    : 0

  return (
    <div className="page-container py-12 sm:py-16">
      {/* --- Container chính bọc toàn bộ nội dung hiển thị --- */}
      {/* Thanh điều hướng Breadcrumb (Ví dụ: Trang chủ / Thực đơn / Tên món) */}
      <nav className="flex items-center gap-2 text-sm text-text-muted mb-8" aria-label="Breadcrumb">
        <Link href="/home" className="hover:text-gold cursor-pointer transition-colors duration-200">
          Trang chủ
        </Link>
        <span className="text-gold/30">/</span>
        <Link href="/thuc-pham" className="hover:text-gold cursor-pointer transition-colors duration-200">
          Thực đơn
        </Link>
        <span className="text-gold/30">/</span>
        <span className="text-primary font-medium truncate">{normalizedFood.name}</span>
      </nav>

      {/* Layout chia 2 cột: Cột Ảnh và Cột Thông Tin/Đặt hàng */}
      <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
        {/* --- Cột Trái: Khu vực hiển thị Ảnh minh hoạ --- */}
        <div className="relative animate-fade-in">
          <div className="relative h-[350px] sm:h-[450px] bg-gradient-to-br from-cream-dark to-cream rounded-3xl overflow-hidden shadow-luxury">
            {normalizedFood.image_url ? (
              <Image
                src={normalizedFood.image_url}
                alt={normalizedFood.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <span className="text-6xl">🍵</span>
                <span className="text-sm text-text-muted">Không có hình</span>
              </div>
            )}
          </div>

          {/* Góc phải màn hình của phần ảnh: Các huy hiệu trạng thái (Nổi bật, Hết hàng) */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            {normalizedFood.is_featured && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-gold text-white shadow-md">
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" />
                </svg>
                Nổi bật
              </span>
            )}
            {!normalizedFood.is_available && (
              <span className="badge-danger">Hết hàng</span>
            )}
          </div>
        </div>

        {/* --- Cột Phải: Thông tin chi tiết món ăn (Tên, Giá, Mô tả) --- */}
        <div className="flex flex-col justify-center animate-fade-in-up">
          {normalizedFood.category && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gold uppercase tracking-[0.15em] mb-3">
              <span className="w-4 h-px bg-gold" />
              {normalizedFood.category.name}
            </span>
          )}

          <h1 className="text-3xl sm:text-4xl font-display font-bold text-primary mb-3">
            {normalizedFood.name}
          </h1>

          <div className="flex items-baseline gap-2 mb-6">
            <p className="text-3xl font-display font-bold text-gold">
              {formatPrice(normalizedFood.price)}
            </p>
            <span className="text-sm text-text-muted">/ phần</span>
          </div>

          {normalizedFood.description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Mô tả</h3>
              <p className="text-text-secondary leading-relaxed">
                {normalizedFood.description}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <CheckCircle2 size={16} className={normalizedFood.is_available ? 'text-accent-green' : 'text-text-muted'} />
              <span>{normalizedFood.is_available ? 'Còn hàng' : 'Hết hàng'}</span>
            </div>
            {normalizedFood.stock_quantity > 0 && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Clock size={16} className="text-gold" />
                <span>{normalizedFood.stock_quantity} phần có sẵn</span>
              </div>
            )}
          </div>

          {/* Component: Form tương tác số lượng và Nút xác nhận đặt món */}
          <OrderForm 
            foodId={normalizedFood.id} 
            price={normalizedFood.price} 
            isAvailable={normalizedFood.is_available} 
            stockQuantity={normalizedFood.stock_quantity}
            userId={session?.user?.id || null} 
            isAdmin={isAdmin}
          />

          <Link
            href="/thuc-pham"
            className="btn-secondary w-full flex items-center justify-center gap-2 mt-4 py-3 rounded-full"
          >
            <ArrowLeft size={18} />
            <span>Quay lại thực đơn</span>
          </Link>
        </div>
      </div>

      <section className="mt-14 border-t border-border-subtle pt-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
              <MessageSquare size={13} />
              <span>Đánh giá sản phẩm</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-primary">
              Khách hàng nói gì về {normalizedFood.name}
            </h2>
          </div>

          {visibleReviews.length > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-white px-4 py-3">
              <StarRating value={Math.round(averageRating)} size="lg" />
              <div>
                <p className="text-sm font-bold text-primary">{averageRating.toFixed(1)} / 5</p>
                <p className="text-xs text-text-muted">{visibleReviews.length} đánh giá</p>
              </div>
            </div>
          )}
        </div>

        {visibleReviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-subtle bg-white p-8 text-center">
            <p className="text-sm font-medium text-primary">Chưa có đánh giá nào</p>
            <p className="text-xs text-text-muted mt-1">Hãy đặt món và để lại cảm nhận đầu tiên.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {visibleReviews.map((review) => (
              <article key={review.id} className="rounded-2xl border border-border-subtle bg-white p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-primary">{review.reviewer_name}</p>
                    <p className="text-[11px] text-text-muted">
                      {new Date(review.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <StarRating value={review.rating} />
                </div>

                {review.comment && (
                  <p className="text-sm text-text-secondary leading-relaxed">{review.comment}</p>
                )}

                {review.admin_reply && (
                  <div className="mt-4 rounded-xl bg-cream/70 border border-gold/10 p-4">
                    <p className="text-xs font-semibold text-gold uppercase tracking-wider mb-1">Phản hồi từ cửa hàng</p>
                    <p className="text-sm text-primary leading-relaxed">{review.admin_reply}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
