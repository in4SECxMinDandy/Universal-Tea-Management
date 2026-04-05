import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import FoodCard from '@/components/food/FoodCard'
import { ArrowRight, Sparkles } from 'lucide-react'
import type { Food } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: featured } = await supabase
    .from('foods')
    .select('*, category:food_categories(name)')
    .eq('is_featured', true)
    .eq('is_available', true)
    .is('deleted_at', null)
    .limit(6)

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50 py-24 sm:py-32">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative page-container text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 text-primary text-sm font-medium mb-6 animate-fade-in">
            <Sparkles size={14} />
            <span>Cửa hàng đồ ăn ngon hàng đầu</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary tracking-tight text-balance mb-6 animate-fade-in-up">
            Chào mừng đến{' '}
            <span className="relative inline-block">
              <span className="relative z-10">UniTEA</span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-primary/10 rounded-sm -z-0" />
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 text-balance animate-fade-in-up animate-stagger-1">
            Đồ ăn ngon — Giao tận nơi — Giá hợp lý.
            <br className="hidden sm:block" />
            Trải nghiệm hương vị tuyệt vời ngay tại nhà bạn.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up animate-stagger-2">
            <Link
              href="/thuc-pham"
              className="btn-primary inline-flex items-center gap-2 text-base"
            >
              Xem thực đơn
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/gioi-thieu"
              className="btn-secondary inline-flex items-center gap-2 text-base"
            >
              Tìm hiểu thêm
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 sm:gap-12 mt-16 animate-fade-in-up animate-stagger-3">
            {[
              { value: '100+', label: 'Món ăn' },
              { value: '5000+', label: 'Khách hàng' },
              { value: '4.8', label: 'Đánh giá' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs sm:text-sm text-text-muted mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured && featured.length > 0 && (
        <section className="page-container py-16 sm:py-20">
          {/* Section header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-amber uppercase tracking-wider mb-2">
                <Sparkles size={12} />
                <span>Được yêu thích nhất</span>
              </div>
              <h2 className="section-heading">Món nổi bật</h2>
              <p className="section-subheading">Những món ăn được khách hàng yêu thích nhất</p>
            </div>
            <Link
              href="/thuc-pham"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all duration-200 cursor-pointer"
            >
              Xem tất cả
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(featured as unknown as Food[]).map((food, idx) => (
              <div
                key={food.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <FoodCard food={food} />
              </div>
            ))}
          </div>

          {/* Mobile "view all" */}
          <div className="sm:hidden mt-6 text-center">
            <Link href="/thuc-pham" className="btn-secondary text-sm">
              Xem tất cả món ăn
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
