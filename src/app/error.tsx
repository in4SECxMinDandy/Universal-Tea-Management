'use client'
import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface AppError extends Error {
  digest?: string
}

interface ErrorProps {
  error: AppError
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-accent-red-light flex items-center justify-center mb-6">
        <AlertTriangle size={36} className="text-accent-red" />
      </div>

      {/* Content */}
      <h2 className="text-2xl font-bold text-primary mb-2">
        Đã xảy ra lỗi
      </h2>
      <p className="text-sm text-text-muted max-w-md mb-2">
        Xin lỗi, có gì đó không ổn định. Vui lòng thử lại.
      </p>
      {error.message && (
        <p className="text-xs text-text-muted max-w-md mb-8 p-3 rounded-lg bg-gray-50 border border-border-subtle inline-block">
          {error.message}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="btn-primary inline-flex items-center gap-2"
        >
          <RefreshCw size={16} />
          <span>Thử lại</span>
        </button>
        <Link href="/" className="btn-secondary inline-flex items-center gap-2">
          <Home size={16} />
          <span>Trang chủ</span>
        </Link>
      </div>
    </div>
  )
}
