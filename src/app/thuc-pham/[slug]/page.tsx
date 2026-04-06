import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react'
import OrderForm from '@/components/food/OrderForm'

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

  const { data: { session } } = await supabase.auth.getSession()

  return (
    <div className="page-container py-12 sm:py-16">
      <nav className="flex items-center gap-2 text-sm text-text-muted mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-gold cursor-pointer transition-colors duration-200">
          Trang chủ
        </Link>
        <span className="text-gold/30">/</span>
        <Link href="/thuc-pham" className="hover:text-gold cursor-pointer transition-colors duration-200">
          Thực đơn
        </Link>
        <span className="text-gold/30">/</span>
        <span className="text-primary font-medium truncate">{food.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
        <div className="relative animate-fade-in">
          <div className="relative h-[350px] sm:h-[450px] bg-gradient-to-br from-cream-dark to-cream rounded-3xl overflow-hidden shadow-luxury">
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
                <span className="text-6xl">🍵</span>
                <span className="text-sm text-text-muted">Không có hình</span>
              </div>
            )}
          </div>

          <div className="absolute top-4 right-4 flex flex-col gap-2">
            {food.is_featured && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-gold text-white shadow-md">
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

        <div className="flex flex-col justify-center animate-fade-in-up">
          {food.category && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gold uppercase tracking-[0.15em] mb-3">
              <span className="w-4 h-px bg-gold" />
              {food.category.name}
            </span>
          )}

          <h1 className="text-3xl sm:text-4xl font-display font-bold text-primary mb-3">
            {food.name}
          </h1>

          <div className="flex items-baseline gap-2 mb-6">
            <p className="text-3xl font-display font-bold text-gold">
              {formatPrice(food.price)}
            </p>
            <span className="text-sm text-text-muted">/ phần</span>
          </div>

          {food.description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Mô tả</h3>
              <p className="text-text-secondary leading-relaxed">
                {food.description}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <CheckCircle2 size={16} className={food.is_available ? 'text-accent-green' : 'text-text-muted'} />
              <span>{food.is_available ? 'Còn hàng' : 'Hết hàng'}</span>
            </div>
            {food.stock_quantity > 0 && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Clock size={16} className="text-gold" />
                <span>{food.stock_quantity} phần có sẵn</span>
              </div>
            )}
          </div>

          <OrderForm 
            foodId={food.id} 
            price={food.price} 
            isAvailable={food.is_available} 
            userId={session?.user?.id || null} 
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
    </div>
  )
}
