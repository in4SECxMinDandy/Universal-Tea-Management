import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import type { FoodWithCategory } from '@/lib/types'

export default function FoodCard({ food }: { food: FoodWithCategory }) {
  return (
    <Link href={`/thuc-pham/${food.slug}`} className="group block border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
      <div className="relative h-48 bg-gray-100">
        {food.image_url ? (
          <Image src={food.image_url} alt={food.name} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">No image</div>
        )}
        {!food.is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-medium">Hết hàng</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold group-hover:text-primary transition-colors">{food.name}</h3>
        {food.category && <p className="text-sm text-gray-500">{food.category.name}</p>}
        <p className="mt-2 font-bold text-primary">{formatPrice(food.price)}</p>
      </div>
    </Link>
  )
}
