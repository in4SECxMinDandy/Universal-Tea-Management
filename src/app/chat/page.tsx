'use client'
import { Suspense } from 'react'
import ChatContent from './ChatContent'

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="text-center py-16">Đang tải...</div>}>
      <ChatContent />
    </Suspense>
  )
}
