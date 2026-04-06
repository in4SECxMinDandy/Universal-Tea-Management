import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import type { FoodWithCategory } from '@/lib/types'

export default function FoodCard({ food }: { food: FoodWithCategory }) {
  return (
    <Link
      href={`/thuc-pham/${food.slug}`}
      className="group block card-base card-hover overflow-hidden cursor-pointer"
    >
      <div className="relative h-56 bg-gradient-to-br from-cream-dark to-cream overflow-hidden">
        {food.image_url ? (
          <Image
            src={food.image_url}
            alt={food.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-luxury group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="text-4xl">🍵</span>
            <span className="text-xs text-text-muted">Không có hình</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {food.is_featured && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gold text-white shadow-md">
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" />
              </svg>
              Nổi bật
            </span>
          </div>
        )}

        {!food.is_available && (
          <div className="absolute inset-0 bg-primary/70 backdrop-blur-sm flex flex-col items-center justify-center gap-1">
            <span className="text-white font-display font-semibold text-sm">Hết hàng</span>
            <span className="text-white/60 text-xs">Vui lòng quay lại sau</span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-primary text-base truncate group-hover:text-gold transition-colors duration-300">
              {food.name}
            </h3>
            {food.category && (
              <p className="text-xs text-text-muted mt-1 truncate uppercase tracking-wider">
                {food.category.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-subtle">
          <p className="text-lg font-display font-bold text-gold">
            {formatPrice(food.price)}
          </p>
          {food.is_available ? (
            <span className="text-xs text-accent-green font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse" />
              Còn hàng
            </span>
          ) : (
            <span className="text-xs text-accent-red font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-accent-red rounded-full" />
              Hết hàng
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
