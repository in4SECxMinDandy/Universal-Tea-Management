'use client'
import { useEffect } from 'react'

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
    <div className="text-center py-16">
      <h2 className="text-xl font-bold mb-2">Đã xảy ra lỗi</h2>
      <p className="text-gray-500 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="border px-4 py-2 rounded cursor-pointer hover:bg-gray-50 transition-colors"
      >
        Thử lại
      </button>
    </div>
  )
}
