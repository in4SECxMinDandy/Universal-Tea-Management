import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resetRateLimitStore } from '@/lib/middleware/rateLimit'

const mockSupabase = {
  auth: {
    getSession: vi.fn(),
  },
  rpc: vi.fn(),
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}))

import { POST } from './route'

describe('POST /api/admin/orders/set-status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimitStore()
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-123' } } },
      error: null,
    })
    mockSupabase.rpc.mockResolvedValue({ data: true, error: null })
    mockSupabase.from.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'order-1', status: 'completed' },
        error: null,
      }),
    })
  })

  it('rejects invalid body', async () => {
    const response = await POST(
      new Request('http://localhost/api/admin/orders/set-status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ order_id: 'bad', status: 'bad' }),
      })
    )

    expect(response.status).toBe(400)
  })

  it('requires admin role', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: false, error: null })

    const response = await POST(
      new Request('http://localhost/api/admin/orders/set-status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          order_id: '550e8400-e29b-41d4-a716-446655440010',
          status: 'completed',
        }),
      })
    )

    expect(response.status).toBe(403)
  })

  it('updates order status for admin', async () => {
    const response = await POST(
      new Request('http://localhost/api/admin/orders/set-status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          order_id: '550e8400-e29b-41d4-a716-446655440010',
          status: 'completed',
        }),
      })
    )

    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(payload.order.status).toBe('completed')
  })
})
