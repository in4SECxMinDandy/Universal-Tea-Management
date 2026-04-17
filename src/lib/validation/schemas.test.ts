import { describe, expect, it } from 'vitest'

import { chatMessageSchema, loginSchema, orderCreateSchema } from './schemas'

describe('chatMessageSchema', () => {
  it('accepts a valid chat payload', () => {
    const result = chatMessageSchema.safeParse({
      session_id: '550e8400-e29b-41d4-a716-446655440000',
      content: 'Xin chao admin',
      image_url: 'https://example.com/image.jpg',
    })

    expect(result.success).toBe(true)
  })

  it('rejects oversized content', () => {
    const result = chatMessageSchema.safeParse({
      session_id: '550e8400-e29b-41d4-a716-446655440000',
      content: 'a'.repeat(2001),
    })

    expect(result.success).toBe(false)
  })

  it('rejects xss payloads', () => {
    const result = chatMessageSchema.safeParse({
      session_id: '550e8400-e29b-41d4-a716-446655440000',
      content: "<script>alert('XSS')</script>",
    })

    expect(result.success).toBe(false)
  })

  it('rejects obvious sql injection payloads', () => {
    const result = chatMessageSchema.safeParse({
      session_id: '550e8400-e29b-41d4-a716-446655440000',
      content: "'; DROP TABLE chat_messages; --",
    })

    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts a valid login payload', () => {
    const result = loginSchema.safeParse({
      email: 'admin@example.com',
      password: 'super-secret',
      captchaToken: 'captcha-token',
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid email addresses', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'super-secret',
    })

    expect(result.success).toBe(false)
  })
})

describe('orderCreateSchema', () => {
  it('accepts a valid order payload', () => {
    const result = orderCreateSchema.safeParse({
      food_id: '550e8400-e29b-41d4-a716-446655440000',
      quantity: 2,
      note: 'it da',
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid quantities', () => {
    const result = orderCreateSchema.safeParse({
      food_id: '550e8400-e29b-41d4-a716-446655440000',
      quantity: 0,
    })

    expect(result.success).toBe(false)
  })
})
