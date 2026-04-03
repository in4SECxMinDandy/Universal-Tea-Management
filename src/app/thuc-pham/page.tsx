import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import FoodCard from '@/components/food/FoodCard'
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
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Thực đơn</h1>

      {categories && categories.length > 0 && (
        <div className="flex gap-3 flex-wrap mb-8">
          {categories.map((cat) => (
            <span key={cat.id} className="px-4 py-2 border rounded-full text-sm">
              {cat.name}
            </span>
          ))}
        </div>
      )}

      {foods && foods.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(foods as unknown as Food[]).map(food => (
            <FoodCard key={food.id} food={food} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Chưa có món nào trong thực đơn.</p>
      )}
    </div>
  )
}
