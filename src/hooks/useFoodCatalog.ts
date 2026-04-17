'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { performanceMonitor } from '@/lib/performance/monitor'
import { queryKeys } from '@/lib/react-query/client'
import { createClient } from '@/lib/supabase/client'
import { FOOD_SELECT_FIELDS } from '@/lib/supabase/selects'
import type { Food } from '@/lib/types'

type UseFoodCatalogOptions = {
  categoryId?: string
  includeUnavailable?: boolean
  includeInactiveCategories?: boolean
  sort?: 'catalog' | 'admin'
}

export function useFoodCatalog(options: UseFoodCatalogOptions = {}) {
  const {
    categoryId,
    includeUnavailable = false,
    includeInactiveCategories = false,
    sort = 'catalog',
  } = options

  const queryClient = useQueryClient()
  const queryKey = queryKeys.foods.list({
      categoryId,
      includeUnavailable,
      includeInactiveCategories,
      sort,
  })
  const hasCachedData = Boolean(queryClient.getQueryState(queryKey)?.dataUpdatedAt)
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const startedAt = performance.now()
      const supabase = createClient()
      let query = supabase
        .from('foods')
        .select(FOOD_SELECT_FIELDS)
        .is('deleted_at', null)

      if (!includeUnavailable) {
        query = query.eq('is_available', true)
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      if (sort === 'admin') {
        query = query.order('created_at', { ascending: false })
      } else {
        query = query.order('sort_order', { ascending: true })
      }

      const { data, error } = await query

      performanceMonitor.trackQueryTime('foods', performance.now() - startedAt)

      if (error) {
        throw error
      }

      return (data ?? []) as unknown as Food[]
    },
  })

  useEffect(() => {
    if (query.isSuccess) {
      performanceMonitor.trackCacheHit('foods', hasCachedData)
    }
  }, [hasCachedData, query.isSuccess])

  return query
}

export function useInvalidateFoodCache() {
  const queryClient = useQueryClient()

  return () => queryClient.invalidateQueries({ queryKey: queryKeys.foods.all })
}
