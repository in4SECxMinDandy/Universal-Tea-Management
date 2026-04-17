'use client'

import Link from 'next/link'

import FoodCard from '@/components/food/FoodCard'
import { useCategories } from '@/hooks/useCategories'
import { useFoodCatalog } from '@/hooks/useFoodCatalog'
import type { Category, Food } from '@/lib/types'

export default function FoodsPageClient({ categoryId }: { categoryId?: string }) {
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesErrored,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategories()
  const {
    data: foods = [],
    isLoading: foodsLoading,
    isError: foodsErrored,
    error: foodsError,
    refetch: refetchFoods,
  } = useFoodCatalog({ categoryId })
  const loading = categoriesLoading || foodsLoading
  const hasError = categoriesErrored || foodsErrored
  const errorMessage =
    (foodsError instanceof Error && foodsError.message) ||
    (categoriesError instanceof Error && categoriesError.message) ||
    'Khong the tai thuc don luc nay.'

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
        {!categoriesLoading && categories.length > 0 && (
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
            {(categories as Category[]).map((cat, idx) => {
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-6">🍵</div>
            <h3 className="text-xl font-display font-bold text-primary mb-2">Đang tải thực đơn</h3>
            <p className="text-sm text-text-muted">Chúng tôi đang lấy dữ liệu mới nhất.</p>
          </div>
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-6">!</div>
            <h3 className="text-xl font-display font-bold text-primary mb-2">Khong the tai thuc don</h3>
            <p className="text-sm text-text-muted mb-6 max-w-md">{errorMessage}</p>
            <button
              type="button"
              onClick={() => {
                void refetchCategories()
                void refetchFoods()
              }}
              className="btn-primary text-sm rounded-full px-6"
            >
              Thu lai
            </button>
          </div>
        ) : foods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(foods as Food[]).map((food, idx) => (
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
