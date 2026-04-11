/**
 * @file AuthContext.test.tsx
 * @description Component tests cho AuthContext
 * 
 * Áp dụng nguyên tắc TDD:
 * - RED: Viết test trước (test sẽ fail)
 * - GREEN: Implement code để test pass
 * - REFACTOR: Cải thiện code nếu cần
 */

import { render, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { AuthProvider, useAuth } from '../contexts/AuthContext'

// Mock supabase client
const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    signOut: vi.fn(),
  },
  rpc: vi.fn(),
}

// Mock module
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

// Component để test hook
function TestComponent() {
  const { user, isAdmin, isLoading, refreshAuth } = useAuth()
  
  return React.createElement('div', null, 
    React.createElement('span', { 'data-testid': 'user' }, user ? user.email : 'no-user'),
    React.createElement('span', { 'data-testid': 'isAdmin' }, String(isAdmin)),
    React.createElement('span', { 'data-testid': 'isLoading' }, String(isLoading)),
    React.createElement('button', { 
      'data-testid': 'refresh',
      onClick: () => refreshAuth()
    }, 'Refresh')
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    // User story: Là người dùng, tôi muốn biết trạng thái loading ban đầu
    it('isLoading ban đầu là false khi không có initial props', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
      })
      mockSupabaseClient.rpc.mockResolvedValue({ data: false })

      const { getByTestId } = render(
        React.createElement(AuthProvider, null, 
          React.createElement(TestComponent)
        )
      )

      await waitFor(() => {
        expect(getByTestId('isLoading')).toHaveTextContent('false')
      })
    })

    it('sử dụng initialAdmin từ props', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' } as any
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
      })
      mockSupabaseClient.rpc.mockResolvedValue({ data: true })

      let getByTestIdRef: any
      await act(async () => {
        const result = render(
          React.createElement(AuthProvider, { 
            initialUser: mockUser, 
            initialAdmin: true 
          }, 
            React.createElement(TestComponent)
          )
        )
        getByTestIdRef = result.getByTestId
      })

      await waitFor(() => {
        expect(getByTestIdRef('isAdmin')).toHaveTextContent('true')
      })
    })
  })

  describe('Session Handling', () => {
    // User story: Là người dùng, tôi muốn đăng nhập và thấy trạng thái được cập nhật
    it('Đặt user đúng khi có session', async () => {
      const mockUser = { 
        id: 'user-123', 
        email: 'loggedin@example.com',
        user_metadata: { full_name: 'Test User' }
      }
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
      })
      mockSupabaseClient.rpc.mockResolvedValue({ data: false })

      const { getByTestId } = render(
        React.createElement(AuthProvider, null, 
          React.createElement(TestComponent)
        )
      )

      await waitFor(() => {
        expect(getByTestId('user')).toHaveTextContent('loggedin@example.com')
      })
    })

    it('user là null khi không có session', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
      })
      mockSupabaseClient.rpc.mockResolvedValue({ data: false })

      const { getByTestId } = render(
        React.createElement(AuthProvider, null, 
          React.createElement(TestComponent)
        )
      )

      await waitFor(() => {
        expect(getByTestId('user')).toHaveTextContent('no-user')
      })
    })
  })

  describe('Admin Role Check', () => {
    // User story: Là admin, tôi muốn có quyền truy cập dashboard
    it('checkAdmin xác định đúng quyền admin (true)', async () => {
      const mockUser = { id: 'admin-123', email: 'admin@example.com' }
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
      })
      mockSupabaseClient.rpc.mockResolvedValue({ data: true })

      const { getByTestId } = render(
        React.createElement(AuthProvider, null, 
          React.createElement(TestComponent)
        )
      )

      await waitFor(() => {
        expect(getByTestId('isAdmin')).toHaveTextContent('true')
      })
    })

    it('checkAdmin xác định đúng quyền admin (false)', async () => {
      const mockUser = { id: 'user-123', email: 'user@example.com' }
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
      })
      mockSupabaseClient.rpc.mockResolvedValue({ data: false })

      const { getByTestId } = render(
        React.createElement(AuthProvider, null, 
          React.createElement(TestComponent)
        )
      )

      await waitFor(() => {
        expect(getByTestId('isAdmin')).toHaveTextContent('false')
      })
    })

    it('xử lý lỗi RPC một cách graceful', async () => {
      const mockUser = { id: 'user-123', email: 'user@example.com' }
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
      })
      mockSupabaseClient.rpc.mockRejectedValue(new Error('RPC Error'))

      const { getByTestId } = render(
        React.createElement(AuthProvider, null, 
          React.createElement(TestComponent)
        )
      )

      await waitFor(() => {
        // Khi có lỗi, isAdmin nên là false
        expect(getByTestId('isAdmin')).toHaveTextContent('false')
      })
    })
  })

  describe('Auth State Changes', () => {
    // User story: Là người dùng, tôi muốn đăng xuất và thấy trạng thái được cập nhật
    it('cập nhật state khi nhận được SIGNED_OUT event', async () => {
      let stateChangeCallback: ((event: string, session: any) => void) | null = null
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123', email: 'user@example.com' } } },
      })
      mockSupabaseClient.rpc.mockResolvedValue({ data: false })
      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        stateChangeCallback = callback
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        }
      })

      const { getByTestId } = render(
        React.createElement(AuthProvider, null, 
          React.createElement(TestComponent)
        )
      )

      await waitFor(() => {
        expect(getByTestId('user')).toHaveTextContent('user@example.com')
      })

      // Trigger sign out
      await act(async () => {
        if (stateChangeCallback) {
          stateChangeCallback('SIGNED_OUT', null)
        }
      })

      await waitFor(() => {
        expect(getByTestId('user')).toHaveTextContent('no-user')
        expect(getByTestId('isAdmin')).toHaveTextContent('false')
      })
    })

    it('cập nhật user khi nhận được SIGNED_IN event', async () => {
      let stateChangeCallback: ((event: string, session: any) => void) | null = null
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
      })
      mockSupabaseClient.rpc.mockResolvedValue({ data: false })
      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        stateChangeCallback = callback
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        }
      })

      const { getByTestId } = render(
        React.createElement(AuthProvider, null, 
          React.createElement(TestComponent)
        )
      )

      await waitFor(() => {
        expect(getByTestId('user')).toHaveTextContent('no-user')
      })

      // Trigger sign in
      const newUser = { id: 'new-user', email: 'newuser@example.com' }
      await act(async () => {
        if (stateChangeCallback) {
          stateChangeCallback('SIGNED_IN', { user: newUser })
        }
      })

      await waitFor(() => {
        expect(getByTestId('user')).toHaveTextContent('newuser@example.com')
      })
    })
  })

  describe('Cleanup', () => {
    // User story: Là developer, tôi muốn đảm bảo không có memory leak
    it('hủy subscription khi unmount component', async () => {
      const unsubscribeMock = vi.fn()
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
      })
      mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: unsubscribeMock } },
      })

      const { unmount } = render(
        React.createElement(AuthProvider, null, 
          React.createElement(TestComponent)
        )
      )

      unmount()

      expect(unsubscribeMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('refreshAuth', () => {
    // User story: Là người dùng, tôi muốn làm mới trạng thái đăng nhập
    it('refreshAuth lấy lại trạng thái user', async () => {
      const mockUser = { id: 'user-123', email: 'user@example.com' }
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
      })
      mockSupabaseClient.rpc.mockResolvedValue({ data: false })

      const { getByTestId, getByRole } = render(
        React.createElement(AuthProvider, null, 
          React.createElement(TestComponent)
        )
      )

      await waitFor(() => {
        expect(getByTestId('user')).toHaveTextContent('user@example.com')
      })

      // Mock getSession lần 2 sau refresh
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-456', email: 'refreshed@example.com' } } },
      })
      mockSupabaseClient.rpc.mockResolvedValue({ data: true })

      await act(async () => {
        userEvent.click(getByRole('button', { name: /refresh/i }))
      })

      await waitFor(() => {
        expect(getByTestId('user')).toHaveTextContent('refreshed@example.com')
      })
    })

    it('refreshAuth xử lý user null một cách graceful', async () => {
      mockSupabaseClient.auth.getSession
        .mockResolvedValueOnce({ data: { session: null } })
        .mockResolvedValueOnce({ data: { session: null } })
      mockSupabaseClient.rpc.mockResolvedValue({ data: false })

      const { getByTestId, getByRole } = render(
        React.createElement(AuthProvider, null, 
          React.createElement(TestComponent)
        )
      )

      await waitFor(() => {
        expect(getByTestId('user')).toHaveTextContent('no-user')
      })

      await act(async () => {
        userEvent.click(getByRole('button', { name: /refresh/i }))
      })

      await waitFor(() => {
        expect(getByTestId('user')).toHaveTextContent('no-user')
        expect(getByTestId('isAdmin')).toHaveTextContent('false')
      })
    })
  })
})
