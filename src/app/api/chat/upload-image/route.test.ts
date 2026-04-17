import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resetRateLimitStore } from '@/lib/middleware/rateLimit'

const { validateImageFileMock, getExtensionForMimeTypeMock } = vi.hoisted(() => ({
  validateImageFileMock: vi.fn(),
  getExtensionForMimeTypeMock: vi.fn(),
}))

const mockSupabase = {
  auth: {
    getSession: vi.fn(),
  },
  from: vi.fn(),
  rpc: vi.fn(),
  storage: {
    from: vi.fn(),
  },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}))

vi.mock('@/lib/validation/fileValidation', () => ({
  validateImageFile: validateImageFileMock,
  getExtensionForMimeType: getExtensionForMimeTypeMock,
}))

import { POST } from './route'

function createSessionQuery(sessionData: unknown, error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: sessionData, error }),
  }
}

describe('POST /api/chat/upload-image', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimitStore()
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
      error: null,
    })
    mockSupabase.rpc.mockResolvedValue({ data: false, error: null })
    validateImageFileMock.mockResolvedValue({
      valid: true,
      detectedMimeType: 'image/png',
    })
    getExtensionForMimeTypeMock.mockReturnValue('png')
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'chat_sessions') {
        return createSessionQuery({
          id: '550e8400-e29b-41d4-a716-446655440000',
          user_id: 'user-123',
          status: 'open',
        })
      }

      throw new Error(`Unexpected table: ${table}`)
    })
    mockSupabase.storage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: 'user-123/file.png' }, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/user-123/file.png' },
      }),
    })
  })

  it('rejects spoofed uploads', async () => {
    validateImageFileMock.mockResolvedValueOnce({
      valid: false,
      error: 'File content does not match declared type.',
    })

    const formData = new FormData()
    formData.append('session_id', '550e8400-e29b-41d4-a716-446655440000')
    formData.append(
      'file',
      new File([new Uint8Array([0x3c, 0x3f, 0x70, 0x68, 0x70])], 'image.jpg', {
        type: 'image/jpeg',
      })
    )

    const response = await POST(
      new Request('http://localhost/api/chat/upload-image', {
        method: 'POST',
        body: formData,
      })
    )

    expect(response.status).toBe(400)
  })

  it('forbids uploading to a foreign session for non-admin users', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'chat_sessions') {
        return createSessionQuery({
          id: '550e8400-e29b-41d4-a716-446655440000',
          user_id: 'someone-else',
          status: 'open',
        })
      }

      throw new Error(`Unexpected table: ${table}`)
    })

    const formData = new FormData()
    formData.append('session_id', '550e8400-e29b-41d4-a716-446655440000')
    formData.append(
      'file',
      new File([new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])], 'image.png', {
        type: 'image/png',
      })
    )

    const response = await POST(
      new Request('http://localhost/api/chat/upload-image', {
        method: 'POST',
        body: formData,
      })
    )
    const payload = await response.json()

    expect(response.status, JSON.stringify(payload)).toBe(403)
  })

  it('returns a public url for valid uploads', async () => {
    const formData = new FormData()
    formData.append('session_id', '550e8400-e29b-41d4-a716-446655440000')
    formData.append(
      'file',
      new File([new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])], 'image.png', {
        type: 'image/png',
      })
    )

    const response = await POST(
      new Request('http://localhost/api/chat/upload-image', {
        method: 'POST',
        body: formData,
      })
    )

    const payload = await response.json()

    expect(response.status, JSON.stringify(payload)).toBe(200)
    expect(payload.url).toContain('https://example.com/')
  })
})
