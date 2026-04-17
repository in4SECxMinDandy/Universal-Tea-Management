'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CHAT_SESSION_SELECT_FIELDS } from '@/lib/supabase/selects'
import { MessageCircle, Loader2, X, MessageSquare, Trash2 } from 'lucide-react'
import AdminChatPanel from '@/components/admin/AdminChatPanel'

interface ChatSession {
  id: string
  user_id: string
  status: 'open' | 'closed'
  opened_at: string
  last_message_at: string
  guest_name: string | null
  session_type: 'qr' | 'account'
  user: { full_name: string | null } | null
  visit: { table_label: string | null } | null
}

export default function AdminChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const supabase = createClient()

  async function load() {
    const { data } = await supabase
      .from('chat_sessions')
      .select(CHAT_SESSION_SELECT_FIELDS)
      .order('last_message_at', { ascending: false })
    if (data) setSessions(data as unknown as ChatSession[])
    setLoading(false)
  }

  // Resolve display name: account full_name > guest_name > table label > fallback
  function getDisplayName(s: ChatSession): string {
    if (s.user?.full_name) return s.user.full_name
    if (s.guest_name) return s.guest_name
    if (s.visit?.table_label) return s.visit.table_label
    return 'Khách ẩn danh'
  }

  function getSessionBadge(s: ChatSession) {
    if (s.session_type === 'account') {
      return { label: 'Tài khoản', color: 'text-blue-600 bg-blue-50 border-blue-200' }
    }
    const tableLabel = s.visit?.table_label
    return { label: tableLabel ? `QR · ${tableLabel}` : 'QR', color: 'text-amber-600 bg-amber-50 border-amber-200' }
  }

  useEffect(() => {
    load()

    const channel = supabase
      .channel('admin-chat-sessions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_sessions' },
        () => { load() }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function closeSession(id: string) {
    if (!confirm('Đóng phiên chat này?')) return
    await supabase.from('chat_sessions').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', id)
    if (selectedSession?.id === id) setSelectedSession(null)
    load()
  }

  async function deleteSession(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (!confirm('Bạn có chắc muốn XÓA phiên chat này không?\nTất cả tin nhắn sẽ bị xóa vĩnh viễn.')) return
    setDeletingId(id)
    // Xóa tin nhắn trước, sau đó xóa session
    await supabase.from('chat_messages').delete().eq('session_id', id)
    await supabase.from('chat_sessions').delete().eq('id', id)
    if (selectedSession?.id === id) {
      setSelectedSession(null)
      setMobileShowChat(false)
    }
    setDeletingId(null)
    load()
  }

  const openSessionCount = sessions.filter(s => s.status === 'open').length

  // Mobile: render list or chat panel based on state
  const showChatPanel = selectedSession !== null

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Page header */}
      <div className="mb-0 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">
              <MessageCircle size={12} />
              <span>Chat hỗ trợ</span>
            </div>
            <h1 className="text-2xl font-bold text-primary">Quản lý Chat</h1>
            <p className="text-sm text-text-muted mt-1">
              {openSessionCount > 0
                ? `${openSessionCount} phiên đang mở`
                : 'Không có phiên chat nào đang mở'}
            </p>
          </div>

          {/* Mobile: back to list button */}
          {mobileShowChat && (
            <button
              onClick={() => { setSelectedSession(null); setMobileShowChat(false) }}
              className="md:hidden btn-secondary flex items-center gap-2 text-sm"
            >
              <MessageSquare size={14} />
              <span>Danh sách</span>
            </button>
          )}
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 min-h-0 mt-6 gap-0">
        {/* Panel trái: Danh sách sessions */}
        <div
          className={`
            w-full md:w-80 flex-shrink-0 flex flex-col border border-border-subtle rounded-2xl overflow-hidden bg-surface-card
            ${showChatPanel && mobileShowChat ? 'hidden md:flex' : 'flex'}
          `}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3">
              <Loader2 size={28} className="text-text-muted animate-spin" />
              <p className="text-sm text-text-muted">Đang tải...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <MessageCircle size={22} className="text-text-muted" />
              </div>
              <p className="text-sm font-medium text-primary mb-1">Chưa có phiên chat</p>
              <p className="text-xs text-text-muted">
                Khi khách quét mã QR và chat, phiên sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {/* Stats bar */}
              {openSessionCount > 0 && (
                <div className="px-4 py-2.5 bg-accent-green/5 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-accent-green rounded-full animate-pulse-soft" />
                    <span className="text-xs font-medium text-accent-green">{openSessionCount} phiên đang mở</span>
                  </div>
                </div>
              )}

              {sessions.map((s, idx) => (
                <div
                  key={s.id}
                  onClick={() => { setSelectedSession(s); setMobileShowChat(true) }}
                  onMouseEnter={() => setHoveredId(s.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`
                    relative px-4 py-3.5 cursor-pointer transition-colors duration-150 border-b border-border-subtle last:border-0
                    animate-fade-in group
                    ${selectedSession?.id === s.id
                      ? 'bg-primary/5 border-l-2 border-l-primary'
                      : 'hover:bg-gray-50'
                    }
                  `}
                  style={{ animationDelay: `${idx * 0.02}s` }}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar — QR guests get amber, account users get primary */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      s.session_type === 'account' ? 'bg-blue-100' : 'bg-amber-100'
                    }`}>
                      <span className={`text-xs font-bold ${
                        s.session_type === 'account' ? 'text-blue-600' : 'text-amber-600'
                      }`}>
                        {getDisplayName(s).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-sm font-medium text-primary truncate">
                          {getDisplayName(s)}
                        </span>
                        {s.status === 'open' && hoveredId !== s.id && (
                          <span className="w-2 h-2 bg-accent-green rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                            getSessionBadge(s).color
                          }`}>
                            {getSessionBadge(s).label}
                          </span>
                          <span className={`text-[11px] font-medium ${s.status === 'open' ? 'text-accent-green' : 'text-text-muted'}`}>
                            {s.status === 'open' ? '· Mở' : '· Đã đóng'}
                          </span>
                        </div>
                        <span className="text-[10px] text-text-muted">
                          {new Date(s.last_message_at).toLocaleString('vi-VN', {
                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Delete button - hiện khi hover */}
                    <button
                      onClick={(e) => deleteSession(e, s.id)}
                      disabled={deletingId === s.id}
                      className={`
                        flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
                        transition-all duration-150 cursor-pointer
                        text-text-muted hover:text-red-500 hover:bg-red-50
                        ${hoveredId === s.id ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                        ${deletingId === s.id ? 'opacity-100' : ''}
                      `}
                      title="Xóa phiên chat"
                      aria-label="Xóa phiên chat"
                    >
                      {deletingId === s.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel phải: Chat panel */}
        <div
          className={`
            flex-1 min-w-0 flex flex-col border border-border-subtle rounded-2xl overflow-hidden bg-surface-card ml-0 md:ml-4
            ${!showChatPanel || !mobileShowChat ? 'hidden md:flex' : 'flex'}
          `}
        >
          {selectedSession ? (
            <AdminChatPanel
              sessionId={selectedSession.id}
              userName={getDisplayName(selectedSession)}
              sessionType={selectedSession.session_type}
              tableLabel={selectedSession.visit?.table_label ?? null}
              onCloseSession={() => void closeSession(selectedSession.id)}
              onClose={() => { setSelectedSession(null); setMobileShowChat(false) }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <MessageSquare size={28} className="text-text-muted" />
              </div>
              <h3 className="text-base font-semibold text-primary mb-2">Chọn phiên chat để trả lời</h3>
              <p className="text-sm text-text-muted max-w-xs">
                Chọn một phiên chat từ danh sách bên trái để bắt đầu trả lời khách hàng.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
