import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resetRateLimitStore } from '@/lib/middleware/rateLimit'

const mockSupabase = {
  auth: {
    getSession: vi.fn(),
  },
  from: vi.fn(),
  rpc: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}))

import { POST } from './route'

function createSingleQuery(data: unknown, error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    limit: vi.fn().mockResolvedValue({ data: data ?? [], error }),
  }
}

function createInsertQuery(data: unknown, error: unknown = null) {
  return {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  }
}

describe('POST /api/reviews/create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimitStore()
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123', email: 'user@example.com', user_metadata: {} } } },
      error: null,
    })
    mockSupabase.rpc.mockResolvedValue({ data: false, error: null })
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'orders') {
        return createSingleQuery({
          id: '550e8400-e29b-41d4-a716-446655440111',
          user_id: 'user-123',
          food_id: '550e8400-e29b-41d4-a716-446655440222',
          status: 'completed',
        })
      }

      if (table === 'food_reviews') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          insert: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'review-1',
              rating: 5,
              comment: 'Rat ngon',
            },
            error: null,
          }),
        }
      }

      throw new Error(`Unexpected table ${table}`)
    })
  })

  it('rejects invalid bodies', async () => {
    const response = await POST(
      new Request('http://localhost/api/reviews/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ order_id: 'bad', rating: 8 }),
      })
    )

    expect(response.status).toBe(400)
  })

  it('requires authentication', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    const response = await POST(
      new Request('http://localhost/api/reviews/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          order_id: '550e8400-e29b-41d4-a716-446655440111',
          rating: 5,
        }),
      })
    )

    expect(response.status).toBe(401)
  })

  it('blocks duplicate reviews', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'orders') {
        return createSingleQuery({
          id: '550e8400-e29b-41d4-a716-446655440111',
          user_id: 'user-123',
          food_id: '550e8400-e29b-41d4-a716-446655440222',
          status: 'completed',
        })
      }

      if (table === 'food_reviews') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [{ id: 'review-1' }], error: null }),
        }
      }

      throw new Error(`Unexpected table ${table}`)
    })

    const response = await POST(
      new Request('http://localhost/api/reviews/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          order_id: '550e8400-e29b-41d4-a716-446655440111',
          rating: 5,
        }),
      })
    )

    expect(response.status).toBe(409)
  })

  it('creates a review for a completed order', async () => {
    const response = await POST(
      new Request('http://localhost/api/reviews/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          order_id: '550e8400-e29b-41d4-a716-446655440111',
          rating: 5,
          comment: 'Rat ngon',
        }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.review.rating).toBe(5)
  })
})
