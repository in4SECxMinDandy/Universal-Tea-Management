'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { AuthGate } from '@/components/auth/RoleGate'

interface Message {
  id: string
  sender_id: string
  sender_role: string
  content: string
  created_at: string
}

interface ChatSession {
  id: string
  user_id: string
  status: string
}

function ChatContent() {
  const [session, setSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const supabase = createClient()

  const visitToken = searchParams.get('visit_token')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let sessionId: string | null = null

      if (visitToken) {
        const { data: existing } = await supabase
          .from('visit_sessions')
          .select('id')
          .eq('visit_token', visitToken)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .single()

        if (existing) {
          const { data: chat } = await supabase
            .from('chat_sessions')
            .select()
            .eq('visit_session_id', existing.id)
            .eq('user_id', user.id)
            .eq('status', 'open')
            .single()
          if (chat) {
            sessionId = chat.id
          } else {
            const { data: newChat } = await supabase
              .from('chat_sessions')
              .insert({ user_id: user.id, visit_session_id: existing.id })
              .select()
              .single()
            sessionId = newChat?.id ?? null
          }
        }
      }

      if (!sessionId) {
        const { data: existing } = await supabase
          .from('chat_sessions')
          .select()
          .eq('user_id', user.id)
          .eq('status', 'open')
          .order('opened_at', { ascending: false })
          .limit(1)
          .single()
        sessionId = existing?.id ?? null
        if (existing) setSession(existing as unknown as ChatSession)
      } else {
        const { data: chatData } = await supabase
          .from('chat_sessions')
          .select()
          .eq('id', sessionId)
          .single()
        if (chatData) setSession(chatData as unknown as ChatSession)
      }

      if (sessionId) {
        const { data: msgs } = await supabase
          .from('chat_messages')
          .select()
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })
        if (msgs) setMessages(msgs as unknown as Message[])
      }
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!session?.id) return
    const channel = supabase
      .channel(`chat-${session.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${session.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as unknown as Message])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session?.id])

  useEffect(() => { bottomRef.current?.scrollIntoView() }, [messages])

  async function sendMessage() {
    if (!input.trim() || !session || sending) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSending(true)
    await supabase.from('chat_messages').insert({
      session_id: session.id,
      sender_id: user.id,
      sender_role: 'USER',
      content: input.trim(),
    })
    setInput('')
    setSending(false)
  }

  if (loading) return <div className="text-center py-16">Đang tải...</div>

  if (!session) {
    return (
      <div className="text-center py-16">
        <p>Không tìm thấy phiên chat.</p>
        <p className="text-sm text-gray-500 mt-2">Vui lòng quét QR code tại cửa hàng để bắt đầu chat.</p>
      </div>
    )
  }

  return (
    <AuthGate>
      <div className="max-w-2xl mx-auto py-6 px-4">
        <h1 className="text-xl font-bold mb-4">Chat với cửa hàng</h1>
        <div className="border rounded-lg h-[500px] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map(msg => {
              const isOwn = msg.sender_role === 'USER'
              return (
                <div key={msg.id} className={`max-w-[75%] px-4 py-2 rounded-lg ${
                  isOwn ? 'bg-black text-white self-end' : 'bg-gray-100 self-start'
                }`}>
                  <p className="text-xs opacity-70 mb-1">{msg.sender_role}</p>
                  <p>{msg.content}</p>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
          <div className="border-t p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Nhập tin nhắn..."
              className="flex-1 border px-3 py-2 rounded"
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="bg-black text-white px-4 py-2 rounded cursor-pointer disabled:opacity-50 transition-colors hover:bg-gray-800"
            >
              Gửi
            </button>
          </div>
        </div>
      </div>
    </AuthGate>
  )
}

export default ChatContent
