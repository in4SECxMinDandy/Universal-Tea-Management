import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { rateLimit, resetRateLimitStore } from './rateLimit'

describe('rateLimit', () => {
  beforeEach(() => {
    resetRateLimitStore()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-12T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    resetRateLimitStore()
  })

  it('allows requests within the configured limit', async () => {
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 2, keyPrefix: 'chat-send' })
    const request = new Request('http://localhost/api/chat/send', {
      headers: { 'x-forwarded-for': '10.0.0.1' },
    })

    const first = await limiter(request)
    const second = await limiter(request)

    expect(first.success).toBe(true)
    expect(second.success).toBe(true)
    expect(second.remaining).toBe(0)
  })

  it('blocks requests after the limit is exceeded', async () => {
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 1, keyPrefix: 'chat-send' })
    const request = new Request('http://localhost/api/chat/send', {
      headers: { 'x-forwarded-for': '10.0.0.1' },
    })

    await limiter(request)
    const blocked = await limiter(request)

    expect(blocked.success).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('tracks limits separately by ip and endpoint', async () => {
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 1 })
    const sendRequest = new Request('http://localhost/api/chat/send', {
      headers: { 'x-forwarded-for': '10.0.0.1' },
    })
    const uploadRequest = new Request('http://localhost/api/chat/upload-image', {
      headers: { 'x-forwarded-for': '10.0.0.1' },
    })

    await limiter(sendRequest)
    const uploadResult = await limiter(uploadRequest)

    expect(uploadResult.success).toBe(true)
  })

  it('resets the window after expiration', async () => {
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 1, keyPrefix: 'auth-login' })
    const request = new Request('http://localhost/api/auth/login', {
      headers: { 'x-forwarded-for': '10.0.0.1' },
    })

    await limiter(request)
    vi.advanceTimersByTime(60_001)

    const afterReset = await limiter(request)

    expect(afterReset.success).toBe(true)
    expect(afterReset.remaining).toBe(0)
  })
})
