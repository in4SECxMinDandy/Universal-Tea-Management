'use client'
import { useEffect } from 'react'

interface AppError extends Error {
  digest?: string
}

export default function Error({ error, reset }: { error: AppError; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="text-center py-16">
      <h2 className="text-xl font-bold mb-2">Đã xảy ra lỗi</h2>
      <p className="text-gray-500 mb-4">{error.message}</p>
      <button onClick={reset} className="border px-4 py-2 rounded cursor-pointer">Thử lại</button>
    </div>
  )
}
