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

function createSessionQuery(sessionData: unknown, error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: sessionData, error }),
  }
}

function createInsertQuery(messageData: unknown, error: unknown = null) {
  return {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: messageData, error }),
  }
}

describe('POST /api/chat/send', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimitStore()
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
      error: null,
    })
    mockSupabase.rpc.mockResolvedValue({ data: false, error: null })
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'chat_sessions') {
        return createSessionQuery({
          id: '550e8400-e29b-41d4-a716-446655440000',
          user_id: 'user-123',
          status: 'open',
        })
      }

      if (table === 'chat_messages') {
        return createInsertQuery({
          id: 'message-1',
          sender_id: 'user-123',
          sender_role: 'USER',
          content: 'Xin chao',
          image_url: null,
          created_at: '2026-04-12T12:00:00Z',
        })
      }

      throw new Error(`Unexpected table: ${table}`)
    })
  })

  it('rejects unauthenticated requests', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    const response = await POST(
      new Request('http://localhost/api/chat/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          session_id: '550e8400-e29b-41d4-a716-446655440000',
          content: 'Xin chao',
        }),
      })
    )

    expect(response.status).toBe(401)
  })

  it('rejects malicious chat payloads', async () => {
    const response = await POST(
      new Request('http://localhost/api/chat/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          session_id: '550e8400-e29b-41d4-a716-446655440000',
          content: "<script>alert('XSS')</script>",
        }),
      })
    )

    expect(response.status).toBe(400)
  })

  it('forbids sending into another users session', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'chat_sessions') {
        return createSessionQuery({
          id: '550e8400-e29b-41d4-a716-446655440000',
          user_id: 'someone-else',
          status: 'open',
        })
      }

      if (table === 'chat_messages') {
        return createInsertQuery(null)
      }

      throw new Error(`Unexpected table: ${table}`)
    })

    const response = await POST(
      new Request('http://localhost/api/chat/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          session_id: '550e8400-e29b-41d4-a716-446655440000',
          content: 'Xin chao',
        }),
      })
    )

    expect(response.status).toBe(403)
  })

  it('allows admins to send to another users session', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: true, error: null })
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'chat_sessions') {
        return createSessionQuery({
          id: '550e8400-e29b-41d4-a716-446655440000',
          user_id: 'someone-else',
          status: 'open',
        })
      }

      if (table === 'chat_messages') {
        return createInsertQuery({
          id: 'message-1',
          sender_id: 'user-123',
          sender_role: 'STORE_ADMIN',
          content: 'Xin chao',
          image_url: null,
          created_at: '2026-04-12T12:00:00Z',
        })
      }

      throw new Error(`Unexpected table: ${table}`)
    })

    const response = await POST(
      new Request('http://localhost/api/chat/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          session_id: '550e8400-e29b-41d4-a716-446655440000',
          content: 'Xin chao',
        }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.message.sender_role).toBe('STORE_ADMIN')
  })
})
