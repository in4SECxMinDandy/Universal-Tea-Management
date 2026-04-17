'use client'
import { QRCodeSVG } from 'qrcode.react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VISIT_SESSION_SELECT_FIELDS } from '@/lib/supabase/selects'
import { nanoid } from 'nanoid'
import { QrCode, Plus, Loader2, Copy, CheckCircle2, Clock, Trash2, Ban, Activity } from 'lucide-react'

interface VisitSession {
  id: string
  visit_token: string
  table_label: string | null
  is_active: boolean
  expires_at: string
  started_at: string
  admin: { full_name: string } | null
  _count?: { chat_sessions: number }
}

type Tab = 'qr' | 'sessions'

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('qr')
  const [token, setToken] = useState('')
  const [created, setCreated] = useState(false)
  const [tableLabel, setTableLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  // Sessions state
  const [sessions, setSessions] = useState<VisitSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)

  async function loadSessions() {
    setSessionsLoading(true)
    try {
      const { data } = await supabase
        .from('visit_sessions')
        .select(VISIT_SESSION_SELECT_FIELDS)
        .order('started_at', { ascending: false })
        .limit(50)
      if (data) setSessions(data as unknown as VisitSession[])
    } finally {
      setSessionsLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
    const channel = supabase
      .channel('admin-visits')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visit_sessions' }, () => { loadSessions() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generateQR() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) { setLoading(false); return }

    const visitToken = nanoid(24)
    const { error } = await supabase.from('visit_sessions').insert({
      visit_token: visitToken,
      user_id: user.id,
      table_label: tableLabel || null,
    })

    if (!error) {
      setToken(visitToken)
      setCreated(true)
      await loadSessions() // Cập nhật ngay lập tức vào danh sách
    }
    setLoading(false)
  }

  const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/chat?visit_token=${token}` : ''

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(qrUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  async function disableSession(id: string) {
    if (!confirm('Dừng phiên này? Mã QR và Link sẽ không còn hiệu lực.')) return
    // Tắt phiên QR
    await supabase.from('visit_sessions').update({ is_active: false }).eq('id', id)
    // Đồng thời đóng tất cả các chat_sessions liên kết với phiên QR này
    await supabase.from('chat_sessions').update({ status: 'closed' }).eq('visit_session_id', id)
    await loadSessions()
  }

  async function deleteSession(id: string) {
    if (!confirm('Xoá vĩnh viễn phiên này? Hành động không thể hoàn tác.')) return
    await supabase.from('visit_sessions').delete().eq('id', id)
    loadSessions()
  }

  const now = new Date()
  const activeSessions = sessions.filter(s => s.is_active && new Date(s.expires_at) > now)
  const expiredSessions = sessions.filter(s => !s.is_active || new Date(s.expires_at) <= now)

  function getSessionStatus(s: VisitSession) {
    if (!s.is_active) return 'vô-hiệu'
    if (new Date(s.expires_at) <= now) return 'hết-hạn'
    return 'hoạt-động'
  }

  return (
    <div className="max-w-3xl">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">Quản lý cửa hàng, tạo mã QR và theo dõi phiên truy cập</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-8">
        <button
          onClick={() => setTab('qr')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 ${
            tab === 'qr' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-primary'
          }`}
        >
          <QrCode size={14} />
          <span>Tạo QR</span>
        </button>
        <button
          onClick={() => setTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 ${
            tab === 'sessions' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-primary'
          }`}
        >
          <Activity size={14} />
          <span>Danh sách Session</span>
        </button>
      </div>

      {/* Tab: Tạo QR */}
      {tab === 'qr' && (
        !created ? (
          <div className="card-base p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                <QrCode size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-primary">Tạo QR Code</h2>
                <p className="text-xs text-text-muted">Tạo mã để khách quét và bắt đầu chat</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-primary" htmlFor="tableLabel">
                  Nhãn bàn (tuỳ chọn)
                </label>
                <input
                  id="tableLabel"
                  type="text"
                  placeholder="VD: Bàn 5, Quầy Bar, Tầng 2..."
                  value={tableLabel}
                  onChange={e => setTableLabel(e.target.value)}
                  className="input-field"
                />
              </div>
              <button
                onClick={generateQR}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /><span>Đang tạo...</span></>
                ) : (
                  <><Plus size={16} /><span>Tạo mã QR</span></>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="card-base p-6 sm:p-8 animate-scale-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent-green-light flex items-center justify-center">
                <CheckCircle2 size={20} className="text-accent-green" />
              </div>
              <div>
                <h2 className="font-semibold text-primary">QR Code đã sẵn sàng!</h2>
                <p className="text-xs text-text-muted">{tableLabel ? `Bàn: ${tableLabel}` : 'Không ghi nhãn'}</p>
              </div>
            </div>
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-2xl shadow-card-base border border-border-subtle">
                <QRCodeSVG value={qrUrl} size={200} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Link chia sẻ</label>
              <div className="flex gap-2">
                <input type="text" value={qrUrl} readOnly className="input-field flex-1 text-xs font-mono" />
                <button onClick={copyUrl} className="btn-secondary flex items-center gap-1.5 px-3" aria-label="Sao chép link">
                  {copied ? <CheckCircle2 size={14} className="text-accent-green" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-border-subtle">
              <h3 className="text-sm font-semibold text-primary mb-2">Hướng dẫn</h3>
              <ol className="text-xs text-text-secondary space-y-1 list-decimal list-inside">
                <li>In mã QR này và đặt tại bàn</li>
                <li>Khách hàng quét mã bằng điện thoại</li>
                <li>Họ được chuyển đến trang chat với cửa hàng</li>
                <li>Nhân viên nhận tin nhắn và phản hồi ngay</li>
              </ol>
            </div>
            <button
              onClick={() => { setCreated(false); setToken(''); setTableLabel('') }}
              className="btn-secondary w-full mt-6 flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              <span>Tạo mã mới</span>
            </button>
          </div>
        )
      )}

      {/* Tab: Danh sách Session */}
      {tab === 'sessions' && (
        <div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card-base p-4 text-center">
              <p className="text-2xl font-bold text-primary">{sessions.length}</p>
              <p className="text-xs text-text-muted mt-0.5">Tổng phiên</p>
            </div>
            <div className="card-base p-4 text-center">
              <p className="text-2xl font-bold text-accent-green">{activeSessions.length}</p>
              <p className="text-xs text-text-muted mt-0.5">Đang hoạt động</p>
            </div>
            <div className="card-base p-4 text-center">
              <p className="text-2xl font-bold text-accent-red">{expiredSessions.length}</p>
              <p className="text-xs text-text-muted mt-0.5">Hết hạn / Vô hiệu</p>
            </div>
          </div>

          {sessionsLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={28} className="text-text-muted animate-spin" />
              <p className="text-sm text-text-muted">Đang tải...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center card-base p-12">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Clock size={24} className="text-text-muted" />
              </div>
              <p className="text-sm font-medium text-primary mb-1">Chưa có phiên nào</p>
              <p className="text-xs text-text-muted">Tạo mã QR để bắt đầu theo dõi phiên truy cập.</p>
            </div>
          ) : (
            <div className="card-base overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 bg-gray-50 border-b border-border-subtle text-xs font-semibold text-text-secondary uppercase tracking-wider">
                <div className="col-span-3">Mã bàn</div>
                <div className="col-span-2">Người tạo</div>
                <div className="col-span-2">Ngày tạo</div>
                <div className="col-span-2">Hết hạn</div>
                <div className="col-span-2">Trạng thái</div>
                <div className="col-span-1"></div>
              </div>
              <div className="divide-y divide-border-subtle">
                {sessions.map(s => {
                  const status = getSessionStatus(s)
                  return (
                    <div key={s.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 px-5 py-4 hover:bg-gray-50 transition-colors duration-150">
                      {/* Table */}
                      <div className="md:col-span-3 flex items-center gap-2">
                        <span className="text-sm font-medium text-primary truncate">
                          {s.table_label || '—'}
                        </span>
                        <span className="text-[10px] font-mono text-text-muted bg-gray-100 px-1.5 py-0.5 rounded truncate hidden md:inline">
                          {s.visit_token.slice(0, 8)}...
                        </span>
                      </div>
                      {/* Creator */}
                      <div className="md:col-span-2 flex items-center">
                        <span className="text-xs text-text-secondary truncate">
                          {s.admin?.full_name ?? '—'}
                        </span>
                      </div>
                      {/* Created */}
                      <div className="md:col-span-2 flex items-center">
                        <span className="text-xs text-text-muted">
                          {new Date(s.started_at).toLocaleString('vi-VN', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                          })}
                        </span>
                      </div>
                      {/* Expires */}
                      <div className="md:col-span-2 flex items-center">
                        <span className="text-xs text-text-muted">
                          {new Date(s.expires_at).toLocaleString('vi-VN', {
                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {/* Status */}
                      <div className="md:col-span-2 flex items-center">
                        {status === 'hoạt-động' && (
                          <span className="badge-success">
                            <span className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse-soft inline-block mr-1.5" />
                            Hoạt động
                          </span>
                        )}
                        {status === 'hết-hạn' && (
                          <span className="badge-warning">Hết hạn</span>
                        )}
                        {status === 'vô-hiệu' && (
                          <span className="badge-neutral">Vô hiệu</span>
                        )}
                      </div>
                      {/* Actions */}
                      <div className="md:col-span-1 flex items-center gap-1 justify-start md:justify-end">
                        {status === 'hoạt-động' && (
                          <button
                            onClick={() => disableSession(s.id)}
                            className="h-7 px-2 flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium text-accent-red hover:bg-accent-red-light/30 border border-accent-red/20 cursor-pointer transition-colors duration-150"
                            title="Dừng phiên này"
                          >
                            <Ban size={12} />
                            Dừng
                          </button>
                        )}
                        <button
                          onClick={() => deleteSession(s.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-accent-red hover:bg-red-50 cursor-pointer transition-colors duration-150"
                          title="Xoá"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
