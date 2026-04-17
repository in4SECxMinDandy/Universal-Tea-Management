import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { createQueryClient } from '@/lib/react-query/client'

import { useCategories, useInvalidateCategoryCache } from './useCategories'
import { useFoodCatalog, useInvalidateFoodCache } from './useFoodCatalog'

const fromMock = vi.fn()

function createChainableMock(data: unknown, error: unknown = null) {
  const chain: Record<string, (...args: unknown[]) => unknown> = {}

  ;['select', 'eq', 'is', 'order', 'or'].forEach((method) => {
    chain[method] = vi.fn(() => chain)
  })

  chain.then = (onFulfilled: (value: { data: unknown; error: unknown }) => unknown) =>
    Promise.resolve(onFulfilled({ data, error }))
  chain.catch = vi.fn()
  chain.finally = vi.fn()

  return chain
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: fromMock,
  }),
}))

function createWrapper(queryClient: ReturnType<typeof createQueryClient>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('catalog query hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('serves food data from cache while stale time is active', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'foods') {
        return createChainableMock([
          {
            id: 'food-1',
            name: 'Tra sua',
            slug: 'tra-sua',
            price: 25000,
            image_url: null,
            description: null,
            is_available: true,
            is_featured: false,
            category_id: 'cat-1',
            stock_quantity: 10,
            category: { id: 'cat-1', name: 'Tra sua', slug: 'tra-sua' },
          },
        ])
      }

      if (table === 'food_categories') {
        return createChainableMock([])
      }

      throw new Error(`Unexpected table ${table}`)
    })

    const queryClient = createQueryClient()
    const wrapper = createWrapper(queryClient)

    const first = renderHook(() => useFoodCatalog(), { wrapper })

    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    expect(fromMock).toHaveBeenCalledTimes(1)

    first.unmount()

    const second = renderHook(() => useFoodCatalog(), { wrapper })

    await waitFor(() => expect(second.result.current.isSuccess).toBe(true))
    expect(fromMock).toHaveBeenCalledTimes(1)
  })

  it('refetches foods after invalidation', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'foods') {
        return createChainableMock([
          {
            id: 'food-1',
            name: 'Tra sua',
            slug: 'tra-sua',
            price: 25000,
            image_url: null,
            description: null,
            is_available: true,
            is_featured: false,
            category_id: 'cat-1',
            stock_quantity: 10,
            category: { id: 'cat-1', name: 'Tra sua', slug: 'tra-sua' },
          },
        ])
      }

      if (table === 'food_categories') {
        return createChainableMock([])
      }

      throw new Error(`Unexpected table ${table}`)
    })

    const queryClient = createQueryClient()
    const wrapper = createWrapper(queryClient)

    const foodsHook = renderHook(() => useFoodCatalog(), { wrapper })
    const invalidateHook = renderHook(() => useInvalidateFoodCache(), { wrapper })

    await waitFor(() => expect(foodsHook.result.current.isSuccess).toBe(true))
    expect(fromMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      await invalidateHook.result.current()
    })

    await waitFor(() => expect(fromMock).toHaveBeenCalledTimes(2))
  })

  it('caches categories and refetches them after invalidation', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'food_categories') {
        return createChainableMock([
          { id: 'cat-1', name: 'Tra sua', slug: 'tra-sua', sort_order: 0, is_active: true },
        ])
      }

      if (table === 'foods') {
        return createChainableMock([])
      }

      throw new Error(`Unexpected table ${table}`)
    })

    const queryClient = createQueryClient()
    const wrapper = createWrapper(queryClient)

    const categoriesHook = renderHook(() => useCategories(), { wrapper })
    const invalidateHook = renderHook(() => useInvalidateCategoryCache(), { wrapper })

    await waitFor(() => expect(categoriesHook.result.current.isSuccess).toBe(true))
    expect(fromMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      await invalidateHook.result.current()
    })

    await waitFor(() => expect(fromMock).toHaveBeenCalledTimes(2))
  })
})
