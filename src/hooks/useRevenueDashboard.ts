'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

import type { RevenueDashboardOrder, RevenueDashboardReview } from '@/lib/admin/revenue-dashboard'
import { performanceMonitor } from '@/lib/performance/monitor'
import { queryKeys } from '@/lib/react-query/client'
import { ADMIN_FOOD_REVIEW_SELECT_FIELDS, ADMIN_REVENUE_ORDER_SELECT_FIELDS } from '@/lib/supabase/selects'
import { createClient } from '@/lib/supabase/client'

type RevenueDashboardPayload = {
  orders: RevenueDashboardOrder[]
  reviews: RevenueDashboardReview[]
}

export function useRevenueDashboard() {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.analytics.revenueDashboard
  const hasCachedData = Boolean(queryClient.getQueryState(queryKey)?.dataUpdatedAt)
  const supabase = useMemo(() => createClient(), [])

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const startedAt = performance.now()
      const [ordersResult, reviewsResult] = await Promise.all([
        supabase
          .from('orders')
          .select(ADMIN_REVENUE_ORDER_SELECT_FIELDS)
          .order('created_at', { ascending: false }),
        supabase
          .from('food_reviews')
          .select(ADMIN_FOOD_REVIEW_SELECT_FIELDS)
          .order('created_at', { ascending: false }),
      ])

      performanceMonitor.trackQueryTime('admin-revenue-dashboard', performance.now() - startedAt)

      if (ordersResult.error) {
        throw ordersResult.error
      }

      if (reviewsResult.error) {
        throw reviewsResult.error
      }

      return {
        orders: (ordersResult.data ?? []) as unknown as RevenueDashboardOrder[],
        reviews: (reviewsResult.data ?? []) as unknown as RevenueDashboardReview[],
      } satisfies RevenueDashboardPayload
    },
  })

  useEffect(() => {
    if (query.isSuccess) {
      performanceMonitor.trackCacheHit('admin-revenue-dashboard', hasCachedData)
    }
  }, [hasCachedData, query.isSuccess])

  useEffect(() => {
    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey })
    }

    const channel = supabase
      .channel('admin-revenue-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'food_reviews' }, invalidate)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, queryKey, supabase])

  return query
}
