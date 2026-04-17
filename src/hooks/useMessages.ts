'use client'

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

import { TWO_MINUTES, queryKeys } from '@/lib/react-query/client'
import { performanceMonitor } from '@/lib/performance/monitor'
import { MESSAGE_PAGE_SIZE, calculateNextCursor, mergeMessagePages } from '@/lib/pagination/utils'
import { createClient } from '@/lib/supabase/client'
import { CHAT_MESSAGE_SELECT_FIELDS } from '@/lib/supabase/selects'
import { withTimeout } from '@/lib/utils'
import type { ChatMessage, ChatMessageCursor } from '@/lib/types'

export interface MessagesPage {
  messages: ChatMessage[]
  nextCursor: ChatMessageCursor | null
  hasMore: boolean
}

export function useMessages(sessionId: string | null | undefined) {
  const queryClient = useQueryClient()
  const queryKey = sessionId ? queryKeys.messages.session(sessionId) : queryKeys.messages.session('__missing__')
  const hasCachedData = Boolean(queryClient.getQueryState(queryKey)?.dataUpdatedAt)

  const query = useInfiniteQuery({
    queryKey,
    enabled: Boolean(sessionId),
    initialPageParam: null as ChatMessageCursor | null,
    gcTime: TWO_MINUTES,
    staleTime: 0,
    queryFn: async ({ pageParam }) => {
      if (!sessionId) {
        return { messages: [], nextCursor: null, hasMore: false }
      }

      const startedAt = performance.now()
      const supabase = createClient()
      let dbQuery = supabase
        .from('chat_messages')
        .select(CHAT_MESSAGE_SELECT_FIELDS)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(MESSAGE_PAGE_SIZE + 1)

      if (pageParam) {
        dbQuery = dbQuery.or(
          `created_at.lt.${pageParam.created_at},and(created_at.eq.${pageParam.created_at},id.lt.${pageParam.id})`
        )
      }

      const { data, error } = await withTimeout(
        dbQuery,
        8000,
        'Tai tin nhan qua lau. Vui long thu lai.'
      )
      performanceMonitor.trackQueryTime('messages', performance.now() - startedAt)

      if (error) throw error

      const rows = (data ?? []) as unknown as ChatMessage[]
      const hasMore = rows.length > MESSAGE_PAGE_SIZE
      const messages = hasMore ? rows.slice(0, MESSAGE_PAGE_SIZE) : rows

      return {
        messages,
        nextCursor: hasMore ? calculateNextCursor(messages) : null,
        hasMore,
      } satisfies MessagesPage
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  const messages = useMemo(() => mergeMessagePages(query.data?.pages), [query.data?.pages])
  const hasMore = query.data?.pages.at(-1)?.hasMore ?? false

  useEffect(() => {
    if (query.isSuccess) {
      performanceMonitor.trackCacheHit('messages', hasCachedData)
    }
  }, [hasCachedData, query.isSuccess])

  return {
    ...query,
    messages,
    hasMore,
  }
}

export function useInvalidateMessages(sessionId: string | null | undefined) {
  const queryClient = useQueryClient()

  return () => {
    if (!sessionId) return Promise.resolve()
    return queryClient.invalidateQueries({ queryKey: queryKeys.messages.session(sessionId) })
  }
}
