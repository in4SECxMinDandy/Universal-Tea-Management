import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold/10 to-gold/5 flex items-center justify-center">
          <span className="text-2xl">🍵</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-gold flex items-center justify-center">
          <Loader2 size={12} className="text-gold animate-spin" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-primary font-display">Đang tải...</p>
        <p className="text-xs text-text-muted mt-0.5">Vui lòng chờ một chút</p>
      </div>
    </div>
  )
}
