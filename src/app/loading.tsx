import { Loader2, UtensilsCrossed } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center">
          <UtensilsCrossed size={24} className="text-primary" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface-card border-2 border-primary flex items-center justify-center">
          <Loader2 size={12} className="text-primary animate-spin" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-primary">Đang tải...</p>
        <p className="text-xs text-text-muted mt-0.5">Vui lòng chờ một chút</p>
      </div>
    </div>
  )
}
