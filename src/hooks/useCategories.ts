'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { performanceMonitor } from '@/lib/performance/monitor'
import { queryKeys } from '@/lib/react-query/client'
import { createClient } from '@/lib/supabase/client'
import { FOOD_CATEGORY_SELECT_FIELDS } from '@/lib/supabase/selects'
import type { FoodCategory } from '@/lib/types'

type UseCategoriesOptions = {
  activeOnly?: boolean
}

export function useCategories(options: UseCategoriesOptions = {}) {
  const { activeOnly = true } = options
  const queryClient = useQueryClient()
  const queryKey = queryKeys.categories.list({ activeOnly })
  const hasCachedData = Boolean(queryClient.getQueryState(queryKey)?.dataUpdatedAt)

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const startedAt = performance.now()
      const supabase = createClient()
      let query = supabase
        .from('food_categories')
        .select(FOOD_CATEGORY_SELECT_FIELDS)
        .order('sort_order', { ascending: true })

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

      performanceMonitor.trackQueryTime('categories', performance.now() - startedAt)

      if (error) {
        throw error
      }

      return (data ?? []) as FoodCategory[]
    },
  })

  useEffect(() => {
    if (query.isSuccess) {
      performanceMonitor.trackCacheHit('categories', hasCachedData)
    }
  }, [hasCachedData, query.isSuccess])

  return query
}

export function useInvalidateCategoryCache() {
  const queryClient = useQueryClient()

  return () => queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
}
