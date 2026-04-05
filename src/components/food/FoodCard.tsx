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
      {/* Image container */}
      <div className="relative h-52 bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
        {food.image_url ? (
          <Image
            src={food.image_url}
            alt={food.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <svg
              className="w-12 h-12 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
            <span className="text-xs text-gray-300">Không có hình</span>
          </div>
        )}

        {/* Featured badge */}
        {food.is_featured && (
          <div className="absolute top-3 left-3">
            <span className="badge-success flex items-center gap-1">
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" />
              </svg>
              Nổi bật
            </span>
          </div>
        )}

        {/* Unavailable overlay */}
        {!food.is_available && (
          <div className="absolute inset-0 bg-primary/70 flex flex-col items-center justify-center gap-1">
            <span className="text-white font-semibold text-sm">Hết hàng</span>
            <span className="text-white/70 text-xs">Vui lòng quay lại sau</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-primary text-base truncate group-hover:text-primary transition-colors duration-150">
              {food.name}
            </h3>
            {food.category && (
              <p className="text-xs text-text-muted mt-0.5 truncate">
                {food.category.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-lg font-bold text-primary">
            {formatPrice(food.price)}
          </p>
          {food.is_available ? (
            <span className="text-xs text-accent-green font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-accent-green rounded-full" />
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
