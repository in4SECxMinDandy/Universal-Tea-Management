import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { RoleGate, AuthGate } from './RoleGate'

// Mock supabase client
const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
  },
  rpc: vi.fn(),
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('RoleGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('hiển thị loading khi đang kiểm tra quyền', () => {
    mockSupabaseClient.auth.getSession.mockReturnValue(
      new Promise(resolve => setTimeout(() => resolve({ data: { session: null } }), 1000))
    )

    render(
      <RoleGate role="STORE_ADMIN">
        <div>Content</div>
      </RoleGate>
    )

    expect(screen.getByText('Đang kiểm tra quyền truy cập...')).toBeInTheDocument()
  })

  it('chuyển hướng khi không có user', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
    })

    render(
      <RoleGate role="STORE_ADMIN">
        <div>Content</div>
      </RoleGate>
    )

    await waitFor(() => {
      expect(screen.queryByText('Content')).not.toBeInTheDocument()
    })
  })

  it('hiển thị nội dung khi user có quyền', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-1' } } },
    })
    mockSupabaseClient.rpc.mockResolvedValue({ data: true })

    render(
      <RoleGate role="STORE_ADMIN">
        <div data-testid="content">Admin Content</div>
      </RoleGate>
    )

    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })
  })

  it('hiển thị thông báo không có quyền khi user không có quyền', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    })
    mockSupabaseClient.rpc.mockResolvedValue({ data: false })

    render(
      <RoleGate role="STORE_ADMIN">
        <div>Admin Content</div>
      </RoleGate>
    )

    await waitFor(() => {
      expect(screen.getByText('Không có quyền truy cập')).toBeInTheDocument()
    })
  })
})

describe('AuthGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('hiển thị loading khi đang kiểm tra đăng nhập', () => {
    mockSupabaseClient.auth.getSession.mockReturnValue(
      new Promise(resolve => setTimeout(() => resolve({ data: { session: null } }), 1000))
    )

    render(
      <AuthGate>
        <div>Protected Content</div>
      </AuthGate>
    )

    expect(screen.getByText('Đang kiểm tra đăng nhập...')).toBeInTheDocument()
  })

  it('hiển thị nội dung khi đã đăng nhập', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    })

    render(
      <AuthGate>
        <div data-testid="content">Protected Content</div>
      </AuthGate>
    )

    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })
  })
})
