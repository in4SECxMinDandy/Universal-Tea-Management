'use client'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { nanoid } from 'nanoid'

export default function AdminDashboard() {
  const [token, setToken] = useState('')
  const [created, setCreated] = useState(false)
  const [tableLabel, setTableLabel] = useState('')
  const supabase = createClient()

  async function generateQR() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const visitToken = nanoid(24)
    const { error } = await supabase.from('visit_sessions').insert({
      visit_token: visitToken,
      user_id: user.id,
      table_label: tableLabel || null,
    })

    if (!error) {
      setToken(visitToken)
      setCreated(true)
    }
  }

  const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/chat?visit_token=${token}` : ''

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {!created ? (
        <div className="border rounded-lg p-6 max-w-md">
          <h2 className="font-semibold mb-4">Tạo QR Code cho khách</h2>
          <input
            type="text"
            placeholder="Nhãn bàn (VD: Bàn 5)"
            value={tableLabel}
            onChange={e => setTableLabel(e.target.value)}
            className="w-full border px-3 py-2 rounded mb-4"
          />
          <button onClick={generateQR} className="bg-black text-white px-4 py-2 rounded cursor-pointer transition-colors hover:bg-gray-800">
            Tạo QR Code
          </button>
        </div>
      ) : (
        <div className="border rounded-lg p-6 max-w-md">
          <h2 className="font-semibold mb-4">QR Code — {tableLabel || 'Không ghi nhãn'}</h2>
          <div className="bg-white p-4 rounded-lg inline-block">
            <QRCodeSVG value={qrUrl} size={200} />
          </div>
          <p className="text-sm text-gray-500 mt-3">Khách quét để bắt đầu chat</p>
          <p className="text-xs font-mono bg-gray-100 p-2 rounded mt-2 break-all">{qrUrl}</p>
          <button onClick={() => { setCreated(false); setToken('') }} className="mt-4 text-sm border px-3 py-1 rounded cursor-pointer transition-colors hover:bg-gray-50">
            Tạo mới
          </button>
        </div>
      )}
    </div>
  )
}
