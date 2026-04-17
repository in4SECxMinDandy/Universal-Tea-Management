import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resetRateLimitStore } from '@/lib/middleware/rateLimit'

const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  },
  rpc: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}))

import { POST } from './route'

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimitStore()
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'admin-123', email: 'admin@example.com' },
        session: { access_token: 'access-token', refresh_token: 'refresh-token' },
      },
      error: null,
    })
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })
    mockSupabase.rpc.mockResolvedValue({ data: true, error: null })
  })

  it('rejects invalid request bodies', async () => {
    const response = await POST(
      new Request('http://localhost/api/auth/login?admin=1', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'not-an-email',
          password: 'short',
        }),
      })
    )

    expect(response.status).toBe(400)
  })

  it('returns 401 for invalid credentials', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    })

    const response = await POST(
      new Request('http://localhost/api/auth/login?admin=1', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'super-secret',
        }),
      })
    )

    expect(response.status).toBe(401)
  })

  it('signs non-admin users out when admin access is required', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: false, error: null })

    const response = await POST(
      new Request('http://localhost/api/auth/login?admin=1', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'super-secret',
        }),
      })
    )

    expect(response.status).toBe(403)
    expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1)
  })

  it('returns the authenticated user for valid admin login', async () => {
    const response = await POST(
      new Request('http://localhost/api/auth/login?admin=1', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'super-secret',
          captchaToken: 'captcha-token',
        }),
      })
    )

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.user.email).toBe('admin@example.com')
    expect(payload.isAdmin).toBe(true)
    expect(payload.session.access_token).toBe('access-token')
  })
})
