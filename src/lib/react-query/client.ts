import { QueryClient } from '@tanstack/react-query'

export const FIVE_MINUTES = 1000 * 60 * 5
export const TWO_MINUTES = 1000 * 60 * 2

export const queryKeys = {
  foods: {
    all: ['foods'] as const,
    list: (filters: {
      categoryId?: string
      includeUnavailable?: boolean
      includeInactiveCategories?: boolean
      sort?: 'catalog' | 'admin'
    }) => ['foods', filters] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: (filters: { activeOnly?: boolean }) => ['categories', filters] as const,
  },
  messages: {
    all: ['messages'] as const,
    session: (sessionId: string) => ['messages', sessionId] as const,
  },
  chatSessions: {
    all: ['chatSessions'] as const,
  },
  analytics: {
    revenueDashboard: ['analytics', 'revenue-dashboard'] as const,
  },
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: FIVE_MINUTES,
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 1,
      },
    },
  })
}
