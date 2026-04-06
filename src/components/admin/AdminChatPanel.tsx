'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2, ImagePlus, X } from 'lucide-react'
import Image from 'next/image'

interface Message {
  id: string
  sender_id: string
  sender_role: string
  content: string
  image_url: string | null
  created_at: string
}

interface AdminChatPanelProps {
  sessionId: string
  userName: string
  sessionType?: 'qr' | 'account'
  tableLabel?: string | null
  onClose?: () => void
}

export default function AdminChatPanel({ sessionId, userName, sessionType = 'qr', tableLabel, onClose }: AdminChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prevMsgCountRef = useRef(0)
  const supabase = createClient()

  // Stable fetch function to avoid stale closures in realtime handler
  const fetchMessages = useCallback(async () => {
    const { data: msgs } = await supabase
      .from('chat_messages')
      .select()
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
    if (msgs) setMessages(msgs as unknown as Message[])
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Realtime subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel(`admin-chat-messages-${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${sessionId}` },
        () => fetchMessages()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, fetchMessages])

  // Polling fallback every 5s in case realtime drops
  useEffect(() => {
    const interval = setInterval(() => fetchMessages(), 5000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  useEffect(() => {
    prevMsgCountRef.current = 0
  }, [sessionId])

  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevMsgCountRef.current = messages.length
  }, [messages])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      alert('Chỉ hỗ trợ file ảnh JPG, PNG, GIF, WEBP')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Ảnh tối đa 5MB')
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const uploadImage = async (adminId: string): Promise<string | null> => {
    if (!imageFile) return null
    setUploadProgress(true)
    const ext = imageFile.name.split('.').pop()
    const fileName = `${adminId}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('chat-images')
      .upload(fileName, imageFile, { cacheControl: '3600', upsert: false })
    setUploadProgress(false)
    if (uploadError) {
      console.error('Upload error:', uploadError)
      alert('Lỗi khi tải ảnh lên, vui lòng thử lại')
      return null
    }
    const { data: urlData } = supabase.storage.from('chat-images').getPublicUrl(fileName)
    return urlData?.publicUrl ?? null
  }

  async function sendMessage() {
    if ((!input.trim() && !imageFile) || sending) return
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user || null
    if (!user) return

    setSending(true)
    let uploadedUrl: string | null = null
    if (imageFile) {
      uploadedUrl = await uploadImage(user.id)
      if (!uploadedUrl && imageFile) {
        setSending(false)
        return
      }
    }

    const { error: msgError } = await supabase.from('chat_messages').insert({
      session_id: sessionId,
      sender_id: user.id,
      sender_role: 'STORE_ADMIN',
      content: input.trim() || (uploadedUrl ? 'Đã gửi một ảnh' : ''),
      image_url: uploadedUrl,
    })

    if (!msgError) {
      setInput('')
      clearImage()
      // Optimistically fetch after send
      await fetchMessages()
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 size={28} className="text-text-muted animate-spin" />
        <p className="text-sm text-text-muted">Đang tải tin nhắn...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border-subtle bg-surface-card flex-shrink-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          sessionType === 'account' ? 'bg-blue-100' : 'bg-amber-100'
        }`}>
          <span className={`text-xs font-bold ${
            sessionType === 'account' ? 'text-blue-600' : 'text-amber-600'
          }`}>
            {(userName || 'K').charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-primary truncate">{userName || 'Khách hàng'}</p>
            {sessionType === 'account' ? (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border text-blue-600 bg-blue-50 border-blue-200 flex-shrink-0">
                Tài khoản
              </span>
            ) : (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border text-amber-600 bg-amber-50 border-amber-200 flex-shrink-0">
                {tableLabel ? `QR · ${tableLabel}` : 'QR'}
              </span>
            )}
          </div>
          <p className="text-xs text-accent-green">Đang trò chuyện</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-primary hover:bg-gray-100 cursor-pointer transition-colors duration-150"
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 bg-gray-50/50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm font-medium text-primary mb-1">Chưa có tin nhắn</p>
            <p className="text-xs text-text-muted">Bắt đầu cuộc trò chuyện với khách hàng</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isAdmin = msg.sender_role === 'STORE_ADMIN'
          const showAvatar = idx === 0 || messages[idx - 1]?.sender_role !== msg.sender_role

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} animate-fade-in`}
            >
              {showAvatar && (
                <span className={`text-xs font-medium mb-1 ${isAdmin ? 'text-right text-text-muted' : 'text-left text-accent-green'}`}>
                  {isAdmin ? 'Cửa hàng' : (userName || 'Khách hàng')}
                </span>
              )}
              <div
                className={`
                  max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                  ${isAdmin
                    ? 'bg-primary text-white rounded-br-md'
                    : 'bg-white text-primary rounded-bl-md border border-border-subtle shadow-sm'
                  }
                `}
              >
                {msg.image_url && (
                  <div className="mb-2 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                    <Image
                      src={msg.image_url}
                      alt="Ảnh đính kèm"
                      width={280}
                      height={180}
                      className="max-w-full h-auto rounded-xl object-cover"
                      style={{ maxHeight: '180px', width: 'auto' }}
                      onClick={() => window.open(msg.image_url!, '_blank')}
                      unoptimized
                    />
                  </div>
                )}
                {msg.content && msg.content !== 'Đã gửi một ảnh' && (
                  <p>{msg.content}</p>
                )}
                <p className={`text-[10px] mt-1 ${isAdmin ? 'text-white/50' : 'text-text-muted'} text-right`}>
                  {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-4 pt-3 border-t border-border-subtle bg-surface-card flex-shrink-0">
          <div className="relative inline-block">
            <Image
              src={imagePreview}
              alt="Xem trước ảnh"
              width={80}
              height={80}
              className="w-20 h-20 object-cover rounded-xl border border-border-subtle"
              unoptimized
            />
            <button
              onClick={clearImage}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
              aria-label="Xoá ảnh"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border-subtle p-4 bg-surface-card flex-shrink-0">
        <div className="flex gap-2 items-end">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleImageSelect}
            id="admin-chat-image-input"
          />
          <label
            htmlFor="admin-chat-image-input"
            className={`
              flex items-center justify-center w-[44px] h-[44px] rounded-xl border border-border-subtle
              cursor-pointer transition-colors shrink-0
              ${imageFile ? 'bg-accent-green-light border-accent-green text-accent-green' : 'bg-surface-card text-text-muted hover:bg-gray-100'}
            `}
            title="Đính kèm ảnh"
          >
            {uploadProgress ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ImagePlus size={16} />
            )}
          </label>

          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Nhập tin nhắn trả lời..."
              className="input-field resize-none pr-4 py-3 min-h-[44px] max-h-[120px] text-sm"
              rows={1}
              disabled={sending}
              style={{ height: 'auto', overflowY: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = Math.min(target.scrollHeight, 120) + 'px'
              }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={sending || (!input.trim() && !imageFile)}
            className="btn-primary flex items-center justify-center w-[44px] h-[44px] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            aria-label="Gửi tin nhắn"
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
