import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import FoodCard from '@/components/food/FoodCard'
import { UtensilsCrossed, ArrowRight } from 'lucide-react'
import type { Food, Category } from '@/lib/types'

export default async function FoodsPage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: foods }] = await Promise.all([
    supabase
      .from('food_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('foods')
      .select('*, category:food_categories(name)')
      .eq('is_available', true)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true }),
  ])

  return (
    <div className="page-container py-12 sm:py-16">
      {/* Page header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
          <UtensilsCrossed size={12} />
          <span>Thực đơn</span>
        </div>
        <h1 className="section-heading">Danh sách món ăn</h1>
        <p className="section-subheading">
          Khám phá các món ăn đa dạng, chất lượng và giá cả hợp lý
        </p>
      </div>

      {/* Category pills */}
      {categories && categories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-10">
          {(categories as unknown as Category[]).map((cat, idx) => (
            <button
              key={cat.id}
              className="
                px-4 py-2 rounded-full text-sm font-medium cursor-pointer
                border border-border-subtle bg-surface-card text-text-secondary
                transition-all duration-200 ease-smooth
                hover:border-primary hover:text-primary hover:shadow-sm
                active:scale-95
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
              "
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Food grid */}
      {foods && foods.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(foods as unknown as Food[]).map((food, idx) => (
            <div
              key={food.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.05}s`, opacity: 0 }}
            >
              <FoodCard food={food} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <UtensilsCrossed size={24} className="text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-1">Chưa có món nào</h3>
          <p className="text-sm text-text-muted mb-4">Thực đơn đang được cập nhật, vui lòng quay lại sau.</p>
          <Link href="/" className="btn-secondary text-sm">
            Quay lại trang chủ
          </Link>
        </div>
      )}
    </div>
  )
}
