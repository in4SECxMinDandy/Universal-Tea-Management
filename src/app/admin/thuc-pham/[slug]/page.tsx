import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { ArrowLeft, CheckCircle2, Clock, Eye, ShieldAlert } from 'lucide-react'

export default async function AdminFoodDetailPage({ params }: { params: Promise<{ slug: string }> }) {
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
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-muted mb-6" aria-label="Breadcrumb">
        <Link href="/admin" className="hover:text-primary transition-colors">Dashboard</Link>
        <span className="text-border-subtle">/</span>
        <Link href="/admin/thuc-pham" className="hover:text-primary transition-colors">Xem thực đơn</Link>
        <span className="text-border-subtle">/</span>
        <span className="text-primary font-medium truncate">{food.name}</span>
      </nav>

      {/* Admin notice */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-6">
        <ShieldAlert size={18} className="text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-700 font-medium">
          Bạn đang xem với tư cách <strong>Quản trị viên</strong>. Chức năng đặt hàng bị vô hiệu hoá.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
        {/* Image */}
        <div className="relative animate-fade-in">
          <div className="relative h-[300px] sm:h-[400px] bg-gradient-to-br from-cream-dark to-cream rounded-2xl overflow-hidden shadow-md">
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
          {food.is_featured && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-gold text-white shadow-md">
                Nổi bật
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center">
          {food.category && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gold uppercase tracking-[0.15em] mb-3">
              <span className="w-4 h-px bg-gold" />
              {food.category.name}
            </span>
          )}

          <h1 className="text-3xl font-bold text-primary mb-3">{food.name}</h1>

          <div className="flex items-baseline gap-2 mb-6">
            <p className="text-3xl font-bold text-gold">{formatPrice(food.price)}</p>
            <span className="text-sm text-text-muted">/ phần</span>
          </div>

          {food.description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Mô tả</h3>
              <p className="text-text-secondary leading-relaxed">{food.description}</p>
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

          {/* Blocked order section */}
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gray-50 border border-border-subtle text-center mb-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <ShieldAlert size={22} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary mb-1">Chức năng đặt hàng bị vô hiệu</p>
              <p className="text-xs text-text-muted">
                Tài khoản Quản trị viên không thể đặt hàng. Chỉ dành cho khách hàng.
              </p>
            </div>
          </div>

          <Link
            href="/admin/thuc-pham"
            className="btn-secondary w-full flex items-center justify-center gap-2 py-3 rounded-xl"
          >
            <ArrowLeft size={16} />
            <span>Quay lại thực đơn</span>
          </Link>

          <div className="mt-3 flex gap-2">
            <Link
              href={`/admin/foods`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium border border-border-subtle text-text-secondary hover:border-primary hover:text-primary transition-all duration-200"
            >
              <Eye size={14} />
              Quản lý món này
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
