import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import FoodCard from '@/components/food/FoodCard'
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
    <div>
      {/* Hero */}
      <section className="bg-gray-50 py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Chào mừng đến với UniTEA</h1>
          <p className="text-xl text-gray-600 mb-8">Đồ ăn ngon — Giao tận nơi — Giá hợp lý</p>
          <Link href="/thuc-pham" className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
            Xem thực đơn
          </Link>
        </div>
      </section>

      {/* Featured */}
      {featured && featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6">Món nổi bật</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(featured as unknown as Food[]).map(food => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
