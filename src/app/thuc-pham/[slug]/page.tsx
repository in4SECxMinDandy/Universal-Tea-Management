import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { ArrowLeft, ShoppingCart, CheckCircle2, Clock, ChefHat } from 'lucide-react'

export default async function FoodDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: food } = await supabase
    .from('foods')
    .select('*, category:food_categories(name)')
    .eq('slug', slug)
    .eq('is_available', true)
    .is('deleted_at', null)
    .single()

  if (!food) {
    notFound()
  }

  return (
    <div className="page-container py-12 sm:py-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-muted mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-primary cursor-pointer transition-colors duration-150">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href="/thuc-pham" className="hover:text-primary cursor-pointer transition-colors duration-150">
          Thực phẩm
        </Link>
        <span>/</span>
        <span className="text-primary font-medium truncate">{food.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <div className="relative animate-fade-in">
          <div className="relative h-[350px] sm:h-[450px] bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl overflow-hidden shadow-card-base">
            {food.image_url ? (
              <Image
                src={food.image_url}
                alt={food.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <ChefHat size={48} className="text-gray-300" />
                <span className="text-sm text-gray-300">Không có hình</span>
              </div>
            )}
          </div>

          {/* Badges overlay */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            {food.is_featured && (
              <span className="badge-success flex items-center gap-1 shadow-sm">
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" />
                </svg>
                Nổi bật
              </span>
            )}
            {!food.is_available && (
              <span className="badge-danger">Hết hàng</span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col justify-center animate-fade-in-up">
          {/* Category */}
          {food.category && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
              {food.category.name}
            </span>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2">
            {food.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-6">
            <p className="text-3xl font-bold text-primary">
              {formatPrice(food.price)}
            </p>
            <span className="text-sm text-text-muted">/ phần</span>
          </div>

          {/* Description */}
          {food.description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-primary mb-2">Mô tả</h3>
              <p className="text-text-secondary leading-relaxed">
                {food.description}
              </p>
            </div>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <CheckCircle2 size={16} className={food.is_available ? 'text-accent-green' : 'text-text-muted'} />
              <span>{food.is_available ? 'Còn hàng' : 'Hết hàng'}</span>
            </div>
            {food.stock_quantity > 0 && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Clock size={16} className="text-text-muted" />
                <span>{food.stock_quantity} phần có sẵn</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              disabled={!food.is_available}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <ShoppingCart size={18} />
              <span>Đặt hàng</span>
            </button>
            <Link
              href="/thuc-pham"
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              <span>Quay lại</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
