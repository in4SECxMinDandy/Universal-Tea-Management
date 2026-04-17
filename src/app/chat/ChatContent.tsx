'use client'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { MessageCircle, Send, ImagePlus, Loader2, X, QrCode, Ban } from 'lucide-react'
import Image from 'next/image'
import { VirtualMessageList } from '@/components/chat/VirtualMessageList'
import { useAdaptivePolling } from '@/hooks/useAdaptivePolling'
import { useMessages } from '@/hooks/useMessages'
import { usePerformanceTracking } from '@/hooks/usePerformanceTracking'
import {
  calculateScrollOffset,
  shouldAutoScroll,
  shouldLoadMore,
} from '@/lib/pagination/utils'
import { CHAT_SESSION_BASIC_SELECT_FIELDS } from '@/lib/supabase/selects'
import type { ChatMessage } from '@/lib/types'

interface ChatSession {
  id: string
  user_id: string
  status: string
  session_type: string
  guest_name: string | null
}

const SESSION_STORAGE_KEY = 'universaltea_chat_session_id'

function ChatContent() {
  const [session, setSession] = useState<ChatSession | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(false)
  const [invalidToken, setInvalidToken] = useState(false)
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [guestNameInput, setGuestNameInput] = useState('')
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sessionIdRef = useRef<string | null>(null)
  const prevMessageCountRef = useRef<number>(0)
  const shouldStickToBottomRef = useRef(true)
  const pendingPrependScrollRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null)
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  usePerformanceTracking('ChatContent')

  const visitToken = searchParams.get('visit_token')
  const {
    messages,
    hasMore,
    fetchNextPage,
    isFetchingNextPage,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useMessages(session?.id)

  useEffect(() => {
    async function init() {
      let { data: { session } } = await supabase.auth.getSession()
      let user = session?.user || null

      if (!user) {
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously()
        if (anonError || !anonData.user) {
          setLoading(false)
          return
        }
        user = anonData.user
      }

      await supabase
        .from('profiles')
        .upsert({ id: user.id, full_name: null }, { onConflict: 'id', ignoreDuplicates: true })

      let sessionId: string | null = null
      let resolvedSession: ChatSession | null = null

      const savedSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY)
      if (savedSessionId) {
        const { data: savedChat } = await supabase
          .from('chat_sessions')
          .select(CHAT_SESSION_BASIC_SELECT_FIELDS)
          .eq('id', savedSessionId)
          .eq('user_id', user.id)
          .eq('status', 'open')
          .single()
        if (savedChat) {
          sessionId = savedChat.id
          resolvedSession = savedChat as unknown as ChatSession
        } else {
          sessionStorage.removeItem(SESSION_STORAGE_KEY)
        }
      }

      if (!sessionId && visitToken) {
        const { data: visitSession } = await supabase
          .from('visit_sessions')
          .select('id')
          .eq('visit_token', visitToken)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .single()

        if (!visitSession) {
          setInvalidToken(true)
          setLoading(false)
          return
        }

        const { data: existingChat } = await supabase
          .from('chat_sessions')
          .select(CHAT_SESSION_BASIC_SELECT_FIELDS)
          .eq('visit_session_id', visitSession.id)
          .eq('user_id', user.id)
          .eq('status', 'open')
          .single()

        if (existingChat) {
          sessionId = existingChat.id
          resolvedSession = existingChat as unknown as ChatSession
        } else {
          const { data: newChat } = await supabase
            .from('chat_sessions')
            .insert({
              user_id: user.id,
              visit_session_id: visitSession.id,
              visit_token: visitToken,
              session_type: 'qr',
            })
            .select(CHAT_SESSION_BASIC_SELECT_FIELDS)
            .single()
          sessionId = newChat?.id ?? null
          resolvedSession = newChat as unknown as ChatSession ?? null
          if (sessionId && user.is_anonymous) setShowNamePrompt(true)
        }
      }

      if (!sessionId) {
        const { data: existing } = await supabase
          .from('chat_sessions')
          .select(CHAT_SESSION_BASIC_SELECT_FIELDS)
          .eq('user_id', user.id)
          .eq('status', 'open')
          .order('opened_at', { ascending: false })
          .limit(1)
          .single()

        if (existing) {
          sessionId = existing.id
          resolvedSession = existing as unknown as ChatSession
          if (!user.is_anonymous && existing.session_type !== 'account') {
            await supabase.from('chat_sessions').update({ session_type: 'account' }).eq('id', existing.id)
          }
        } else if (!visitToken) {
          const { data: newSessionData } = await supabase
            .from('chat_sessions')
            .insert({ user_id: user.id, session_type: 'account' })
            .select(CHAT_SESSION_BASIC_SELECT_FIELDS)
            .single()
          if (newSessionData) {
            sessionId = newSessionData.id
            resolvedSession = newSessionData as unknown as ChatSession
          }
        }
      }

      if (sessionId && resolvedSession) {
        sessionIdRef.current = sessionId
        sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId)
        setSession(resolvedSession)
      }

      setLoading(false)
    }
    init()
  }, [supabase, visitToken])

  useEffect(() => {
    if (!session?.id) return

    sessionIdRef.current = session.id
    setRealtimeConnected(false)

    const channel = supabase
      .channel(`chat-messages-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${session.id}`,
        },
        () => {
          void refetchMessages()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeConnected(true)
          return
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeConnected(false)
          console.warn('[Chat] Realtime unavailable, using polling fallback')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.id, refetchMessages, supabase])

  useEffect(() => {
    if (!session?.id) return

    const sessionChannel = supabase
      .channel(`chat-session-status-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          setSession(payload.new as unknown as ChatSession)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sessionChannel)
    }
  }, [session?.id, supabase])

  useAdaptivePolling({
    enabled: Boolean(session?.id),
    realtimeConnected,
    onPoll: async () => {
      await refetchMessages()
    },
  })

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    if (pendingPrependScrollRef.current) {
      const previous = pendingPrependScrollRef.current
      container.scrollTop = calculateScrollOffset(
        previous.scrollHeight,
        container.scrollHeight,
        previous.scrollTop
      )
      pendingPrependScrollRef.current = null
    } else if (messages.length > prevMessageCountRef.current && shouldStickToBottomRef.current) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    }

    prevMessageCountRef.current = messages.length
  }, [messages])

  const loadOlderMessages = useCallback(async () => {
    const container = messagesContainerRef.current
    if (!container || !hasMore || isFetchingNextPage) return

    pendingPrependScrollRef.current = {
      scrollHeight: container.scrollHeight,
      scrollTop: container.scrollTop,
    }

    await fetchNextPage()
  }, [fetchNextPage, hasMore, isFetchingNextPage])

  const handleMessagesScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return

    shouldStickToBottomRef.current = shouldAutoScroll(
      container.scrollTop,
      container.scrollHeight,
      container.clientHeight
    )

    if (shouldLoadMore(container.scrollTop)) {
      void loadOlderMessages()
    }
  }, [loadOlderMessages])

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

  const uploadImageViaApi = async (chatSessionId: string): Promise<string | null> => {
    if (!imageFile) return null

    setUploadProgress(true)

    try {
      const formData = new FormData()
      formData.append('file', imageFile)
      formData.append('session_id', chatSessionId)

      const response = await fetch('/api/chat/upload-image', {
        method: 'POST',
        body: formData,
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        alert(payload?.error || 'Lỗi khi tải ảnh lên, vui lòng thử lại')
        return null
      }

      return payload?.url ?? null
    } finally {
      setUploadProgress(false)
    }
  }

  async function sendMessage() {
    if ((!input.trim() && !imageFile) || !session || sending) return

    setSending(true)
    let uploadedUrl: string | null = null

    try {
      if (imageFile) {
        uploadedUrl = await uploadImageViaApi(session.id)
        if (!uploadedUrl && imageFile) {
          return
        }
      }

      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          content: input.trim() || (uploadedUrl ? '📷 Đã gửi một ảnh' : ''),
          image_url: uploadedUrl,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        alert(payload?.error || 'Không thể gửi tin nhắn lúc này')
        return
      }

      setInput('')
      clearImage()
      await refetchMessages()
    } finally {
      setSending(false)
    }
  }

  async function saveGuestName(name: string) {
    if (!session) return
    const trimmed = name.trim()
    if (trimmed) {
      await supabase
        .from('chat_sessions')
        .update({ guest_name: trimmed })
        .eq('id', session.id)
      setSession(prev => prev ? { ...prev, guest_name: trimmed } : prev)
    }
    setShowNamePrompt(false)
  }

  const renderMessage = useCallback((msg: ChatMessage, idx: number) => {
    const isOwn = msg.sender_role === 'USER'
    const showAvatar = idx === 0 || messages[idx - 1]?.sender_role !== msg.sender_role

    return (
      <div
        key={msg.id}
        className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} animate-fade-in`}
      >
        {showAvatar && (
          <span className={`text-xs font-medium mb-1 ${isOwn ? 'text-right text-text-muted' : 'text-left text-accent-green'}`}>
            {isOwn ? 'Bạn' : 'Cửa hàng'}
          </span>
        )}
        <div
          className={`
            max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
            ${isOwn
              ? 'bg-primary text-white rounded-br-md'
              : 'bg-gray-100 text-primary rounded-bl-md'
            }
          `}
        >
          {msg.image_url && (
            <div className="mb-2 rounded-xl overflow-hidden">
              <Image
                src={msg.image_url}
                alt="Ảnh đính kèm"
                width={300}
                height={200}
                className="max-w-full h-auto rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                style={{ maxHeight: '200px', width: 'auto' }}
                onClick={() => window.open(msg.image_url!, '_blank')}
                unoptimized
              />
            </div>
          )}
          {msg.content && msg.content !== '📷 Đã gửi một ảnh' && (
            <p>{msg.content}</p>
          )}
          {msg.content === '📷 Đã gửi một ảnh' && !msg.image_url && (
            <p>{msg.content}</p>
          )}
          <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/50' : 'text-text-muted'} text-right`}>
            {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    )
  }, [messages])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 size={32} className="text-text-muted animate-spin" />
        <p className="text-sm text-text-muted">Đang tải cuộc trò chuyện...</p>
      </div>
    )
  }

  if (invalidToken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-accent-red-light flex items-center justify-center mb-4">
          <QrCode size={36} className="text-accent-red" />
        </div>
        <h3 className="text-xl font-bold text-primary mb-2">Mã QR đã hết hạn</h3>
        <p className="text-sm text-text-muted max-w-sm mb-6">
          Mã QR này không còn hiệu lực hoặc đã hết hạn. Vui lòng yêu cầu nhân viên tạo mã mới.
        </p>
        <a href="/home" className="btn-secondary text-sm">Quay lại trang chủ</a>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-accent-amber-light flex items-center justify-center mb-4">
          <QrCode size={36} className="text-accent-amber" />
        </div>
        <h3 className="text-xl font-bold text-primary mb-2">Quét mã QR để bắt đầu</h3>
        <p className="text-sm text-text-muted max-w-sm mb-6">
          Vui lòng quét mã QR tại bàn để bắt đầu trò chuyện với nhân viên.
        </p>
        <a href="/home" className="btn-secondary text-sm">Quay lại trang chủ</a>
      </div>
    )
  }

  return (
    <div className="page-container py-6 max-w-3xl">
      {/* Khung Popup (Modal) hỏi tên người dùng khi bắt đầu chat bằng mã QR */}
      {showNamePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={22} className="text-amber-600" />
            </div>
            <h2 className="text-base font-bold text-primary text-center mb-1">Xin chào!</h2>
            <p className="text-sm text-text-muted text-center mb-4">
              Để nhân viên nhận ra bạn, bạn có muốn cho biết tên không?
            </p>
            <input
              type="text"
              placeholder="Nhập tên của bạn (tuỳ chọn)..."
              value={guestNameInput}
              onChange={e => setGuestNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveGuestName(guestNameInput) }}
              className="input-field w-full mb-3"
              autoFocus
              maxLength={50}
            />
            <div className="flex gap-2">
              <button
                onClick={() => saveGuestName(guestNameInput)}
                className="btn-primary flex-1 text-sm"
              >
                {guestNameInput.trim() ? 'Xác nhận' : 'Bỏ qua'}
              </button>
            </div>
            <p className="text-[11px] text-text-muted text-center mt-3">
              Bạn có thể bỏ qua bước này và vẫn chat bình thường.
            </p>
          </div>
        </div>
      )}

      {/* Phần Tiêu đề chính của trang Chat */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-accent-green-light flex items-center justify-center">
          <MessageCircle size={20} className="text-accent-green" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-primary">Chat với cửa hàng</h1>
          <p className="text-xs text-text-muted">Trò chuyện trực tuyến với nhân viên</p>
        </div>
      </div>

      {/* Khung giao diện chính chứa toàn bộ nội dung chat */}
      <div className="card-base overflow-hidden flex flex-col h-[520px] sm:h-[600px]">
        {/* Khu vực cuộn hiển thị lịch sử tin nhắn */}
        <div
          ref={messagesContainerRef}
          onScroll={handleMessagesScroll}
          className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 scrollbar-hide"
        >
          {messages.length > 0 && (
            <div className="flex justify-center">
              {hasMore ? (
                <button
                  type="button"
                  onClick={() => void loadOlderMessages()}
                  disabled={isFetchingNextPage}
                  className="text-xs font-medium text-text-muted hover:text-primary px-3 py-1.5 rounded-full border border-border-subtle bg-white disabled:opacity-60"
                >
                  {isFetchingNextPage ? 'Đang tải tin cũ...' : 'Tải thêm tin nhắn cũ'}
                </button>
              ) : (
                <span className="text-[11px] text-text-muted">Đã tải toàn bộ tin nhắn</span>
              )}
            </div>
          )}

          {messagesLoading && (
            <div className="flex items-center justify-center h-full text-sm text-text-muted">
              <Loader2 size={18} className="animate-spin mr-2" />
              Đang tải tin nhắn...
            </div>
          )}

          {!messagesLoading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <MessageCircle size={24} className="text-text-muted" />
              </div>
              <p className="text-sm font-medium text-primary mb-1">Bắt đầu cuộc trò chuyện</p>
              <p className="text-xs text-text-muted">Gửi tin nhắn để nhân viên biết bạn cần hỗ trợ gì</p>
            </div>
          )}

          {!messagesLoading && messages.length > 100 ? (
            <VirtualMessageList
              messages={messages}
              scrollParentRef={messagesContainerRef}
              renderMessage={renderMessage}
            />
          ) : (
            messages.map((msg, idx) => {
            const isOwn = msg.sender_role === 'USER'
            const showAvatar = idx === 0 || messages[idx - 1]?.sender_role !== msg.sender_role

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} animate-fade-in`}
              >
                {showAvatar && (
                  <span className={`text-xs font-medium mb-1 ${isOwn ? 'text-right text-text-muted' : 'text-left text-accent-green'}`}>
                    {isOwn ? 'Bạn' : 'Cửa hàng'}
                  </span>
                )}
                <div
                  className={`
                    max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                    ${isOwn
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-gray-100 text-primary rounded-bl-md'
                    }
                  `}
                >
                  {msg.image_url && (
                    <div className="mb-2 rounded-xl overflow-hidden">
                      <Image
                        src={msg.image_url}
                        alt="Ảnh đính kèm"
                        width={300}
                        height={200}
                        className="max-w-full h-auto rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ maxHeight: '200px', width: 'auto' }}
                        onClick={() => window.open(msg.image_url!, '_blank')}
                        unoptimized
                      />
                    </div>
                  )}
                  {msg.content && msg.content !== '📷 Đã gửi một ảnh' && (
                    <p>{msg.content}</p>
                  )}
                  {msg.content === '📷 Đã gửi một ảnh' && !msg.image_url && (
                    <p>{msg.content}</p>
                  )}
                  <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/50' : 'text-text-muted'} text-right`}>
                    {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
            })
          )}
        </div>

        {/* Khung xem trước ảnh tải lên (nếu có) */}
        {imagePreview && (
          <div className="px-4 pt-3 border-t border-border-subtle bg-surface-card">
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
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                aria-label="Xoá ảnh"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Khu vực hành động dưới cùng: Hiển thị trạng thái đóng phiên hoặc Form nhập liệu */}
        {session.status === 'closed' ? (
          <div className="border-t border-border-subtle p-6 bg-surface-card text-center">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-accent-red-light text-accent-red mb-3">
              <Ban size={20} />
            </div>
            <p className="text-sm font-medium text-primary">Phiên chat đã kết thúc</p>
            <p className="text-xs text-text-muted mt-1">
              Nhân viên đã đóng phiên hỗ trợ này. Cảm ơn bạn đã liên hệ!
            </p>
          </div>
        ) : (
          <div className="border-t border-border-subtle p-4 bg-surface-card">
            {/* Khu vực Form nhập liệu: Chọn ảnh, Ô nhập chữ, và Nút gửi container */}
            <div className="flex gap-2 items-end">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleImageSelect}
                id="chat-image-input"
              />
              <label
                htmlFor="chat-image-input"
                className={`
                  flex items-center justify-center w-[48px] h-[48px] rounded-xl border border-border-subtle
                  cursor-pointer transition-colors shrink-0
                  ${imageFile ? 'bg-accent-green-light border-accent-green text-accent-green' : 'bg-surface-card text-text-muted hover:bg-gray-100'}
                `}
                title="Đính kèm ảnh"
              >
                {uploadProgress ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ImagePlus size={18} />
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
                  placeholder={imageFile ? 'Thêm chú thích cho ảnh (tuỳ chọn)...' : 'Nhập tin nhắn...'}
                  className="input-field resize-none pr-4 py-3 min-h-[48px] max-h-[120px]"
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
                className="btn-primary flex items-center gap-2 h-[48px] px-5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                aria-label="Gửi tin nhắn"
              >
                {sending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
            <p className="text-[10px] text-text-muted mt-2 text-center">
              Nhấn Enter để gửi · Shift+Enter để xuống dòng · Đính kèm ảnh tối đa 5MB
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatContent
