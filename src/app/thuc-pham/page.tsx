import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import FoodCard from '@/components/food/FoodCard'
import type { Food, Category } from '@/lib/types'

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function FoodsPage(props: PageProps) {
  const searchParams = await props.searchParams
  const categoryId = searchParams?.category as string | undefined

  const supabase = await createClient()

  let foodQuery = supabase
    .from('foods')
    .select('*, category:food_categories(name)')
    .eq('is_available', true)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  if (categoryId) {
    foodQuery = foodQuery.eq('category_id', categoryId)
  }

  const [{ data: categories }, { data: foods }] = await Promise.all([
    supabase
      .from('food_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    foodQuery,
  ])

  return (
    <div className="min-h-screen">
      <section className="luxury-gradient py-16 sm:py-20">
        <div className="page-container text-center">
          <div className="gold-line mx-auto mb-6" />
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-3 animate-fade-in-up">
            Thực Đơn
          </h1>
          <p className="text-white/50 animate-fade-in-up animate-stagger-1">
            Khám phá bộ sưu tập trà sữa & bánh ngọt cao cấp
          </p>
        </div>
      </section>

      <div className="page-container py-12 sm:py-16">
        {categories && categories.length > 0 && (
          <div className="flex gap-3 flex-wrap mb-10">
            <Link
              href="/thuc-pham"
              className={`
                px-5 py-2.5 rounded-full text-sm font-medium cursor-pointer
                transition-all duration-300 ease-luxury border
                ${!categoryId 
                  ? 'bg-gold text-white border-gold shadow-button-glow' 
                  : 'border-border-subtle bg-white text-text-secondary hover:border-gold hover:text-gold'
                }
              `}
            >
              Tất cả
            </Link>
            {(categories as unknown as Category[]).map((cat, idx) => {
              const isActive = categoryId === cat.id
              return (
                <Link
                  href={`/thuc-pham?category=${cat.id}`}
                  key={cat.id}
                  className={`
                    px-5 py-2.5 rounded-full text-sm font-medium cursor-pointer
                    transition-all duration-300 ease-luxury border
                    ${isActive 
                      ? 'bg-gold text-white border-gold shadow-button-glow' 
                      : 'border-border-subtle bg-white text-text-secondary hover:border-gold hover:text-gold'
                    }
                  `}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {cat.name}
                </Link>
              )
            })}
          </div>
        )}

        {foods && foods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-6">🍵</div>
            <h3 className="text-xl font-display font-bold text-primary mb-2">Chưa có món nào</h3>
            <p className="text-sm text-text-muted mb-6">Thực đơn đang được cập nhật, vui lòng quay lại sau.</p>
            <Link href="/home" className="btn-secondary text-sm rounded-full px-6">
              Quay lại trang chủ
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
