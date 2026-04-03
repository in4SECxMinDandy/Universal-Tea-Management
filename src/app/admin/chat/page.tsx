'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ChatSession {
  id: string
  user_id: string
  status: 'open' | 'closed'
  opened_at: string
  last_message_at: string
  user: { full_name: string }
}

export default function AdminChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function load() {
    const { data } = await supabase
      .from('chat_sessions')
      .select('*, user:profiles(full_name)')
      .order('last_message_at', { ascending: false })
    if (data) setSessions(data as unknown as ChatSession[])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function closeSession(id: string) {
    await supabase.from('chat_sessions').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Quản lý Chat</h1>
      {loading ? <p>Đang tải...</p> : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Khách hàng</th>
              <th className="text-left py-2">Trạng thái</th>
              <th className="text-left py-2">Mở lúc</th>
              <th className="text-left py-2">Tin nhắn cuối</th>
              <th className="text-left py-2">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="py-3">{s.user?.full_name ?? 'N/A'}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 text-xs rounded ${s.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                    {s.status === 'open' ? 'Mở' : 'Đã đóng'}
                  </span>
                </td>
                <td className="py-3">{new Date(s.opened_at).toLocaleString('vi-VN')}</td>
                <td className="py-3">{new Date(s.last_message_at).toLocaleString('vi-VN')}</td>
                <td className="py-3">
                  {s.status === 'open' && (
                    <button onClick={() => closeSession(s.id)} className="text-sm border px-2 py-1 rounded cursor-pointer transition-colors hover:bg-gray-100">
                      Đóng
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
