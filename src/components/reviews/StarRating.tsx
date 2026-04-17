type StarRatingProps = {
  value: number
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
} as const

export default function StarRating({ value, size = 'md' }: StarRatingProps) {
  return (
    <div className={`inline-flex items-center gap-0.5 ${sizeClasses[size]}`} aria-label={`${value} sao`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < value ? 'text-yellow-500' : 'text-gray-300'}>
          ★
        </span>
      ))}
    </div>
  )
}
