import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resetRateLimitStore } from '@/lib/middleware/rateLimit'

const mockSupabase = {
  auth: {
    getSession: vi.fn(),
  },
  rpc: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}))

import { POST } from './route'

describe('POST /api/orders/create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimitStore()
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
      error: null,
    })
    mockSupabase.rpc.mockResolvedValue({
      data: {
        id: 'order-1',
        food_id: '550e8400-e29b-41d4-a716-446655440010',
        quantity: 2,
        total_price: 50000,
        status: 'pending',
      },
      error: null,
    })
  })

  it('rejects invalid order bodies', async () => {
    const response = await POST(
      new Request('http://localhost/api/orders/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ food_id: 'bad', quantity: 0 }),
      })
    )

    expect(response.status).toBe(400)
  })

  it('requires an authenticated user', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    const response = await POST(
      new Request('http://localhost/api/orders/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          food_id: '550e8400-e29b-41d4-a716-446655440010',
          quantity: 2,
        }),
      })
    )

    expect(response.status).toBe(401)
  })

  it('maps stock conflicts to 409', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: { message: 'Insufficient stock' },
    })

    const response = await POST(
      new Request('http://localhost/api/orders/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          food_id: '550e8400-e29b-41d4-a716-446655440010',
          quantity: 2,
        }),
      })
    )

    expect(response.status).toBe(409)
  })

  it('returns the created order on success', async () => {
    const response = await POST(
      new Request('http://localhost/api/orders/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          food_id: '550e8400-e29b-41d4-a716-446655440010',
          quantity: 2,
          note: 'it da',
        }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mockSupabase.rpc).toHaveBeenCalledWith('create_order_secure', {
      _food_id: '550e8400-e29b-41d4-a716-446655440010',
      _quantity: 2,
      _note: 'it da',
    })
    expect(payload.order.status).toBe('pending')
  })
})
