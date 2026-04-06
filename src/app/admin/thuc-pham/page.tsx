import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import type { Food, Category } from '@/lib/types'
import { Eye } from 'lucide-react'

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminFoodsViewPage(props: PageProps) {
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Xem thực đơn</h1>
          <p className="text-sm text-text-muted mt-1">Danh sách món — chế độ xem (Admin không thể đặt hàng)</p>
        </div>
        <Link
          href="/admin/foods"
          className="btn-primary text-sm py-2 px-4 rounded-lg flex items-center gap-2"
        >
          <Eye size={14} />
          Quản lý món
        </Link>
      </div>

      {/* Notice banner */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-6">
        <span className="text-amber-600 text-lg">ℹ️</span>
        <p className="text-sm text-amber-700 font-medium">
          Bạn đang xem thực đơn với tư cách <strong>Quản trị viên</strong>. Chức năng đặt hàng bị vô hiệu hoá.
          Để quản lý món ăn, vào <Link href="/admin/foods" className="underline font-semibold">Quản lý món</Link>.
        </p>
      </div>

      {/* Category filter */}
      {categories && categories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-8">
          <Link
            href="/admin/thuc-pham"
            className={`
              px-4 py-2 rounded-full text-sm font-medium cursor-pointer
              transition-all duration-200 border
              ${!categoryId
                ? 'bg-primary text-white border-primary'
                : 'border-border-subtle bg-white text-text-secondary hover:border-primary hover:text-primary'
              }
            `}
          >
            Tất cả
          </Link>
          {(categories as unknown as Category[]).map((cat) => {
            const isActive = categoryId === cat.id
            return (
              <Link
                href={`/admin/thuc-pham?category=${cat.id}`}
                key={cat.id}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium cursor-pointer
                  transition-all duration-200 border
                  ${isActive
                    ? 'bg-primary text-white border-primary'
                    : 'border-border-subtle bg-white text-text-secondary hover:border-primary hover:text-primary'
                  }
                `}
              >
                {cat.name}
              </Link>
            )
          })}
        </div>
      )}

      {/* Food grid */}
      {foods && foods.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(foods as unknown as Food[]).map((food) => (
            <Link
              key={food.id}
              href={`/admin/thuc-pham/${food.slug}`}
              className="group block bg-white rounded-2xl border border-border-subtle shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="relative h-44 bg-gradient-to-br from-cream-dark to-cream overflow-hidden">
                {food.image_url ? (
                  <Image
                    src={food.image_url}
                    alt={food.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl">🍵</span>
                  </div>
                )}
                {food.is_featured && (
                  <span className="absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] font-bold bg-gold text-white">
                    Nổi bật
                  </span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="flex items-center gap-1 bg-white/90 backdrop-blur-sm text-primary text-xs font-medium px-2 py-1 rounded-full">
                    <Eye size={10} />
                    Xem chi tiết
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-primary text-sm truncate group-hover:text-gold transition-colors duration-200">
                      {food.name}
                    </h3>
                    {food.category && (
                      <p className="text-xs text-text-muted mt-0.5 uppercase tracking-wide">
                        {food.category.name}
                      </p>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                    food.is_available
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {food.is_available ? 'Còn hàng' : 'Hết'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-subtle">
                  <p className="text-base font-bold text-gold">
                    {formatPrice(food.price)}
                  </p>
                  <p className="text-xs text-text-muted">
                    Tồn: {food.stock_quantity} phần
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">🍵</div>
          <h3 className="text-lg font-bold text-primary mb-2">Chưa có món nào</h3>
          <p className="text-sm text-text-muted mb-4">Thực đơn đang được cập nhật.</p>
          <Link href="/admin/foods" className="btn-primary text-sm rounded-lg px-4 py-2">
            Thêm món mới
          </Link>
        </div>
      )}
    </div>
  )
}
