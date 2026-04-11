/**
 * @file ChatContent.test.tsx
 * @description Integration tests cho ChatContent component
 * 
 * Áp dụng nguyên tắc TDD:
 * - RED: Viết test trước (test sẽ fail)
 * - GREEN: Implement code để test pass
 * - REFACTOR: Cải thiện code nếu cần
 */

import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'

// Mock types
interface MockMessage {
  id: string
  sender_id: string
  sender_role: string
  content: string
  image_url: string | null
  created_at: string
}

interface MockSession {
  id: string
  user_id: string
  status: string
  session_type: string
  guest_name: string | null
}

// Mock supabase client
const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    signInAnonymously: vi.fn(),
  },
  from: vi.fn(),
  storage: {
    from: vi.fn(),
  },
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  })),
  removeChannel: vi.fn(),
}

// Mock data
const mockUser = { id: 'user-123', is_anonymous: false, email: 'test@example.com' }
const mockMessages: MockMessage[] = [
  {
    id: 'msg-1',
    sender_id: 'user-123',
    sender_role: 'USER',
    content: 'Xin chào!',
    image_url: null,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'msg-2',
    sender_id: 'admin-1',
    sender_role: 'ADMIN',
    content: 'Chào bạn! Cần hỗ trợ gì?',
    image_url: null,
    created_at: '2024-01-15T10:01:00Z',
  },
]

// Mock module
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

// Mock next/image globally
vi.mock('next/image', () => {
  return {
    default: function MockImage(props: {
      src: string
      alt: string
      width?: number
      height?: number
      className?: string
      onClick?: () => void
      style?: Record<string, unknown>
      unoptimized?: boolean
    }) {
      return React.createElement('img', { 
        'data-testid': 'mock-image', 
        src: props.src, 
        alt: props.alt 
      })
    }
  }
})

// Simple test wrapper that renders ChatContent
function createChatContentMock() {
  // Default mock implementations
  mockSupabaseClient.auth.getSession.mockResolvedValue({
    data: { session: { user: mockUser } },
  })
  
  mockSupabaseClient.from.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }
    }
    if (table === 'chat_sessions') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(null),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ id: 'new-session' }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }
    }
    if (table === 'chat_messages') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              data: mockMessages,
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
    }
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    }
  })
  
  mockSupabaseClient.storage.from.mockReturnValue({
    upload: vi.fn().mockResolvedValue({ data: { path: 'test' }, error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } }),
  })
}

// Dynamic import ChatContent
async function loadChatContent() {
  const { default: ChatContent } = await import('./ChatContent')
  return ChatContent
}

describe('ChatContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createChatContentMock()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Session Initialization', () => {
    // User story: Là khách, tôi muốn bắt đầu cuộc trò chuyện
    it('hiển thị giao diện chat khi có session', async () => {
      const ChatContent = await loadChatContent()
      
      // Override session mock
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'chat_sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  id: 'session-123',
                  user_id: 'user-123',
                  status: 'open',
                  session_type: 'account',
                  guest_name: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ id: 'session-123' }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'chat_messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  data: mockMessages,
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(null),
            }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      })

      render(React.createElement(ChatContent))

      await waitFor(() => {
        expect(screen.getByText(/chat với cửa hàng/i)).toBeInTheDocument()
      })
    })

    it('hiển thị thông báo QR khi không có session', async () => {
      const ChatContent = await loadChatContent()
      
      // Override session mock - no session found
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'chat_sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockRejectedValue({ code: 'PGRST116' }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockRejectedValue({ code: 'PGRST116' }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'chat_messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  data: [],
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockRejectedValue({ code: 'PGRST116' }),
            }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      })

      render(React.createElement(ChatContent))

      await waitFor(() => {
        expect(screen.getByText(/quét mã qr/i)).toBeInTheDocument()
      })
    })
  })

  describe('Message Display', () => {
    // User story: Là khách, tôi muốn thấy các tin nhắn trong cuộc trò chuyện
    it('hiển thị danh sách tin nhắn', async () => {
      const ChatContent = await loadChatContent()
      
      // Override session mock
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'chat_sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  id: 'session-123',
                  user_id: 'user-123',
                  status: 'open',
                  session_type: 'account',
                  guest_name: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ id: 'session-123' }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'chat_messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  data: mockMessages,
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockRejectedValue({ code: 'PGRST116' }),
            }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      })

      render(React.createElement(ChatContent))

      await waitFor(() => {
        expect(screen.getByText('Xin chào!')).toBeInTheDocument()
      })
    })

    it('phân biệt tin nhắn của user và admin bằng giao diện', async () => {
      const ChatContent = await loadChatContent()
      
      // Override session mock
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'chat_sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  id: 'session-123',
                  user_id: 'user-123',
                  status: 'open',
                  session_type: 'account',
                  guest_name: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ id: 'session-123' }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'chat_messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  data: mockMessages,
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockRejectedValue({ code: 'PGRST116' }),
            }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      })

      render(React.createElement(ChatContent))

      await waitFor(() => {
        const userMessages = screen.getAllByText('Bạn')
        const adminMessages = screen.getAllByText('Cửa hàng')
        expect(userMessages.length).toBeGreaterThan(0)
        expect(adminMessages.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Message Input', () => {
    // User story: Là khách, tôi muốn gửi tin nhắn cho cửa hàng
    it('có ô nhập tin nhắn', async () => {
      const ChatContent = await loadChatContent()
      
      // Override session mock
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'chat_sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  id: 'session-123',
                  user_id: 'user-123',
                  status: 'open',
                  session_type: 'account',
                  guest_name: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ id: 'session-123' }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'chat_messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  data: mockMessages,
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockRejectedValue({ code: 'PGRST116' }),
            }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      })

      render(React.createElement(ChatContent))

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/nhập tin nhắn/i)
        expect(input).toBeInTheDocument()
      })
    })

    it('có nút gửi tin nhắn', async () => {
      const ChatContent = await loadChatContent()
      
      // Override session mock
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'chat_sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  id: 'session-123',
                  user_id: 'user-123',
                  status: 'open',
                  session_type: 'account',
                  guest_name: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ id: 'session-123' }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'chat_messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  data: mockMessages,
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockRejectedValue({ code: 'PGRST116' }),
            }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      })

      render(React.createElement(ChatContent))

      await waitFor(() => {
        const sendButton = screen.getByRole('button', { name: /gửi tin nhắn/i })
        expect(sendButton).toBeInTheDocument()
      })
    })

    it('vô hiệu hóa nút gửi khi input trống', async () => {
      const ChatContent = await loadChatContent()
      
      // Override session mock
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'chat_sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  id: 'session-123',
                  user_id: 'user-123',
                  status: 'open',
                  session_type: 'account',
                  guest_name: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ id: 'session-123' }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'chat_messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  data: mockMessages,
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockRejectedValue({ code: 'PGRST116' }),
            }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      })

      render(React.createElement(ChatContent))

      await waitFor(() => {
        const sendButton = screen.getByRole('button', { name: /gửi tin nhắn/i })
        expect(sendButton).toBeDisabled()
      })
    })

    it('cho phép nhập text vào ô tin nhắn', async () => {
      const ChatContent = await loadChatContent()
      
      // Override session mock
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'chat_sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  id: 'session-123',
                  user_id: 'user-123',
                  status: 'open',
                  session_type: 'account',
                  guest_name: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ id: 'session-123' }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'chat_messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  data: mockMessages,
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockRejectedValue({ code: 'PGRST116' }),
            }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      })

      render(React.createElement(ChatContent))

      await waitFor(async () => {
        const input = screen.getByPlaceholderText(/nhập tin nhắn/i)
        await userEvent.type(input, 'Tin nhắn test')
        expect(input).toHaveValue('Tin nhắn test')
      })
    })
  })

  describe('Image Upload', () => {
    // User story: Là khách, tôi muốn gửi ảnh cho cửa hàng
    it('có nút đính kèm ảnh', async () => {
      const ChatContent = await loadChatContent()
      
      // Override session mock
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'chat_sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  id: 'session-123',
                  user_id: 'user-123',
                  status: 'open',
                  session_type: 'account',
                  guest_name: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ id: 'session-123' }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'chat_messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  data: mockMessages,
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockRejectedValue({ code: 'PGRST116' }),
            }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      })

      render(React.createElement(ChatContent))

      await waitFor(() => {
        const imageButton = screen.getByLabelText(/đính kèm ảnh/i)
        expect(imageButton).toBeInTheDocument()
      })
    })
  })

  describe('Session Status', () => {
    // User story: Là khách, tôi muốn biết trạng thái phiên chat
    it('hiển thị thông báo khi session closed', async () => {
      const ChatContent = await loadChatContent()
      
      // Override session mock - closed session
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'chat_sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  id: 'session-123',
                  user_id: 'user-123',
                  status: 'closed',
                  session_type: 'account',
                  guest_name: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ id: 'session-123' }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'chat_messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  data: mockMessages,
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockRejectedValue({ code: 'PGRST116' }),
            }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      })

      render(React.createElement(ChatContent))

      await waitFor(() => {
        expect(screen.getByText(/phiên chat đã kết thúc/i)).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    // User story: Là khách, tôi muốn thấy thông báo khi chưa có tin nhắn
    it('hiển thị thông báo khi không có tin nhắn', async () => {
      const ChatContent = await loadChatContent()
      
      // Override session mock with empty messages
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'chat_sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  id: 'session-123',
                  user_id: 'user-123',
                  status: 'open',
                  session_type: 'account',
                  guest_name: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ id: 'session-123' }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'chat_messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  data: [],
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockRejectedValue({ code: 'PGRST116' }),
            }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      })

      render(React.createElement(ChatContent))

      await waitFor(() => {
        expect(screen.getByText(/bắt đầu cuộc trò chuyện/i)).toBeInTheDocument()
      })
    })
  })

  describe('Realtime Connection', () => {
    // User story: Là khách, tôi muốn nhận tin nhắn mới ngay lập tức
    it('thiết lập realtime subscription khi có session', async () => {
      const ChatContent = await loadChatContent()
      
      // Override session mock
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'chat_sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  id: 'session-123',
                  user_id: 'user-123',
                  status: 'open',
                  session_type: 'account',
                  guest_name: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ id: 'session-123' }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'chat_messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  data: mockMessages,
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockRejectedValue({ code: 'PGRST116' }),
            }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      })

      render(React.createElement(ChatContent))

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalled()
      })
    })

    it('cleanup subscription khi unmount', async () => {
      const ChatContent = await loadChatContent()
      
      // Override session mock
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'chat_sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  id: 'session-123',
                  user_id: 'user-123',
                  status: 'open',
                  session_type: 'account',
                  guest_name: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ id: 'session-123' }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'chat_messages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  data: mockMessages,
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockRejectedValue({ code: 'PGRST116' }),
            }),
          }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      })

      const { unmount } = render(React.createElement(ChatContent))

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalled()
      })

      unmount()

      expect(mockSupabaseClient.removeChannel).toHaveBeenCalled()
    })
  })
})
