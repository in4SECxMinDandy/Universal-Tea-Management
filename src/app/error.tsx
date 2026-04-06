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
      <div className="w-20 h-20 rounded-2xl bg-accent-red-light flex items-center justify-center mb-6">
        <AlertTriangle size={36} className="text-accent-red" />
      </div>

      <h2 className="text-2xl font-display font-bold text-primary mb-2">
        Đã xảy ra lỗi
      </h2>
      <p className="text-sm text-text-muted max-w-md mb-8">
        Xin lỗi, có gì đó không ổn. Vui lòng thử lại.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="btn-primary inline-flex items-center gap-2 rounded-full"
        >
          <RefreshCw size={16} />
          <span>Thử lại</span>
        </button>
        <Link href="/" className="btn-secondary inline-flex items-center gap-2 rounded-full">
          <Home size={16} />
          <span>Trang chủ</span>
        </Link>
      </div>
    </div>
  )
}
