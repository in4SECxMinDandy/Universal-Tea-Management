import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'

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
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative h-80 bg-gray-100 rounded-lg overflow-hidden">
          {food.image_url ? (
            <Image src={food.image_url} alt={food.name} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">No image</div>
          )}
        </div>
        <div>
          {food.category && (
            <p className="text-sm text-gray-500 mb-2">{food.category.name}</p>
          )}
          <h1 className="text-3xl font-bold mb-4">{food.name}</h1>
          <p className="text-2xl font-bold text-primary mb-4">{formatPrice(food.price)}</p>
          {food.description && (
            <p className="text-gray-600 mb-6">{food.description}</p>
          )}
          <div className="flex gap-3">
            <button className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
              Đặt hàng
            </button>
            <button className="border px-6 py-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              Quay lại
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
