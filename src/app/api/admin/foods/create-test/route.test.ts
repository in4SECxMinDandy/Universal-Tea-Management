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

describe('POST /api/admin/foods/create-test', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimitStore()
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-123' } } },
      error: null,
    })
    mockSupabase.rpc.mockResolvedValue({ data: true, error: null })
    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'food-1', slug: 'food-1', name: 'Food 1' },
        error: null,
      }),
    })
  })

  it('rejects invalid body', async () => {
    const response = await POST(
      new Request('http://localhost/api/admin/foods/create-test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '', price: 0, stock_quantity: 0 }),
      })
    )

    expect(response.status).toBe(400)
  })

  it('requires admin role', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: false, error: null })

    const response = await POST(
      new Request('http://localhost/api/admin/foods/create-test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Food 1', price: 10000, stock_quantity: 10 }),
      })
    )

    expect(response.status).toBe(403)
  })

  it('creates a test food for admin', async () => {
    const response = await POST(
      new Request('http://localhost/api/admin/foods/create-test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Food 1', price: 10000, stock_quantity: 10 }),
      })
    )

    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(payload.food.name).toBe('Food 1')
  })
})
