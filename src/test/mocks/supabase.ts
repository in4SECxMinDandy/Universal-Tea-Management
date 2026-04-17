import { vi } from 'vitest'

export function createChainableMock(data: unknown = null, error: unknown = null) {
  const chain: Record<string, unknown> = {}

  ;[
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'gt',
    'lt',
    'is',
    'or',
    'order',
    'limit',
  ].forEach((method) => {
    chain[method] = vi.fn(() => chain)
  })

  chain.single = vi.fn(async () => ({ data, error }))
  chain.then = (onFulfilled: (value: { data: unknown; error: unknown }) => unknown) =>
    Promise.resolve(onFulfilled({ data, error }))

  return chain
}

export function createStorageMock() {
  return {
    upload: vi.fn(async () => ({ data: { path: 'mock-path' }, error: null })),
    getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/mock-path' } })),
  }
}

export function createRealtimeMock() {
  return {
    on: vi.fn(() => createRealtimeMock()),
    subscribe: vi.fn(() => createRealtimeMock()),
    unsubscribe: vi.fn(),
  }
}

export function createMockSupabaseClient(overrides: Record<string, unknown> = {}) {
  const storageMock = createStorageMock()
  const realtimeMock = createRealtimeMock()

  return {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      signInAnonymously: vi.fn(async () => ({ data: { user: null }, error: null })),
      signOut: vi.fn(async () => ({ error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => createChainableMock()),
    storage: {
      from: vi.fn(() => storageMock),
    },
    channel: vi.fn(() => realtimeMock),
    removeChannel: vi.fn(),
    rpc: vi.fn(async () => ({ data: null, error: null })),
    ...overrides,
  }
}
