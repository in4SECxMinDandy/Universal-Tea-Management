# Design Document: Performance Optimization

## Overview

This design implements comprehensive performance optimizations for the universaltea application, targeting three critical areas: client-side caching with React Query, message pagination with cursor-based loading, and virtual scrolling for large message lists. The solution reduces database load, improves perceived performance, and maintains smooth UI interactions even with large datasets.

The implementation introduces React Query (@tanstack/react-query) as the caching layer, implements cursor-based pagination for chat messages, adds virtual scrolling for message lists exceeding 100 items, and includes performance monitoring to track optimization effectiveness.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Components                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ChatContent  │  │ AdminPanel   │  │ FoodCatalog  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Custom Hooks Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │useMessages   │  │useFoodCatalog│  │useCategories │      │
│  │(paginated)   │  │(cached)      │  │(cached)      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Query Layer                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │  QueryClient (cache + state management)            │     │
│  │  - 5min staleTime for food/categories              │     │
│  │  - Infinite query for messages                     │     │
│  │  - Automatic background refetch                    │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Client                           │
│  - Optimized queries (select specific fields)               │
│  - Cursor-based pagination                                   │
│  - Realtime subscriptions                                    │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**Food Catalog Loading:**
1. User navigates to food catalog page
2. `useFoodCatalog` hook checks React Query cache
3. If cache hit (< 5min old): serve from cache instantly
4. If cache miss or stale: fetch from Supabase, update cache
5. Background refetch keeps data fresh

**Message Pagination:**
1. Chat loads: fetch most recent 50 messages (cursor = null)
2. User scrolls to top: trigger `fetchNextPage` with cursor
3. Load previous 50 messages using cursor-based pagination
4. Maintain scroll position after load
5. Realtime updates append new messages without refetch

**Virtual Scrolling:**
1. Calculate visible viewport height
2. Render only messages in viewport + buffer (20 items above/below)
3. Use absolute positioning for off-screen items
4. Update rendered range on scroll events (throttled)

## Components and Interfaces

### React Query Configuration

**File:** `src/lib/react-query/client.ts`

```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
})

// Query keys for consistent cache management
export const queryKeys = {
  foods: ['foods'] as const,
  categories: ['categories'] as const,
  messages: (sessionId: string) => ['messages', sessionId] as const,
  chatSessions: ['chatSessions'] as const,
}
```

**File:** `src/lib/react-query/provider.tsx`

```typescript
'use client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './client'

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
```

### Custom Hooks for Data Fetching

**File:** `src/hooks/useFoodCatalog.ts`

```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/react-query/client'

interface Food {
  id: string
  name: string
  description: string
  price: number
  category_id: string
  image_url: string | null
  is_available: boolean
}

export function useFoodCatalog() {
  const supabase = createClient()
  
  return useQuery({
    queryKey: queryKeys.foods,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('foods')
        .select('id, name, description, price, category_id, image_url, is_available')
        .eq('is_available', true)
        .order('name')
      
      if (error) throw error
      return data as Food[]
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useInvalidateFoodCache() {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.foods })
  }
}
```

**File:** `src/hooks/useCategories.ts`

```typescript
import { useQuery, useQueryClient } from '@tantml:parameter>
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/react-query/client'

interface Category {
  id: string
  name: string
  sort_order: number
}

export function useCategories() {
  const supabase = createClient()
  
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, sort_order')
        .order('sort_order')
      
      if (error) throw error
      return data as Category[]
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useInvalidateCategoryCache() {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.categories })
  }
}
```

### Pagination Implementation

**File:** `src/hooks/useMessages.ts`

```typescript
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/react-query/client'

interface Message {
  id: string
  sender_id: string
  sender_role: string
  content: string
  image_url: string | null
  created_at: string
}

interface MessagesPage {
  messages: Message[]
  nextCursor: string | null
  hasMore: boolean
}

const PAGE_SIZE = 50

export function useMessages(sessionId: string) {
  const supabase = createClient()
  
  return useInfiniteQuery({
    queryKey: queryKeys.messages(sessionId),
    queryFn: async ({ pageParam }): Promise<MessagesPage> => {
      let query = supabase
        .from('chat_messages')
        .select('id, sender_id, sender_role, content, image_url, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE + 1) // Fetch one extra to determine if there are more
      
      // Cursor-based pagination: fetch messages older than cursor
      if (pageParam) {
        query = query.lt('created_at', pageParam)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      const messages = (data || []) as Message[]
      const hasMore = messages.length > PAGE_SIZE
      const pageMessages = hasMore ? messages.slice(0, PAGE_SIZE) : messages
      
      // Cursor is the created_at of the oldest message in this page
      const nextCursor = hasMore && pageMessages.length > 0
        ? pageMessages[pageMessages.length - 1].created_at
        : null
      
      // Reverse to show oldest first within each page
      return {
        messages: pageMessages.reverse(),
        nextCursor,
        hasMore,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
    staleTime: 0, // Always fetch fresh for messages
    gcTime: 1000 * 60 * 2, // Keep in cache for 2 minutes
  })
}

export function useInvalidateMessages(sessionId: string) {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.messages(sessionId) })
  }
}
```

### Virtual Scrolling Component

**File:** `src/components/chat/VirtualMessageList.tsx`

```typescript
'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

interface Message {
  id: string
  sender_id: string
  sender_role: string
  content: string
  image_url: string | null
  created_at: string
}

interface VirtualMessageListProps {
  messages: Message[]
  renderMessage: (message: Message, index: number) => React.ReactNode
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
}

export function VirtualMessageList({
  messages,
  renderMessage,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: VirtualMessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated message height
    overscan: 20, // Render 20 items above/below viewport
  })
  
  const items = virtualizer.getVirtualItems()
  
  // Load more when scrolling to top
  useEffect(() => {
    const [firstItem] = items
    
    if (!firstItem) return
    
    if (
      firstItem.index === 0 &&
      hasMore &&
      !isLoadingMore &&
      onLoadMore
    ) {
      onLoadMore()
    }
  }, [items, hasMore, isLoadingMore, onLoadMore])
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (shouldAutoScroll && messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, {
        align: 'end',
        behavior: 'smooth',
      })
    }
  }, [messages.length, shouldAutoScroll, virtualizer])
  
  // Detect manual scroll
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    
    setShouldAutoScroll(isNearBottom)
  }, [])
  
  return (
    <div
      ref={parentRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto"
      style={{ height: '100%' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {isLoadingMore && (
          <div className="absolute top-0 left-0 right-0 p-4 text-center">
            <span className="text-sm text-text-muted">Loading more messages...</span>
          </div>
        )}
        
        {items.map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
            data-index={virtualItem.index}
          >
            {renderMessage(messages[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Optimized Polling Strategy

**File:** `src/hooks/useAdaptivePolling.ts`

```typescript
import { useEffect, useRef, useState } from 'react'

interface UseAdaptivePollingOptions {
  onPoll: () => void
  enabled: boolean
  realtimeConnected: boolean
  pollingInterval?: number // milliseconds
  inactivityThreshold?: number // milliseconds
}

export function useAdaptivePolling({
  onPoll,
  enabled,
  realtimeConnected,
  pollingInterval = 30000, // 30 seconds
  inactivityThreshold = 300000, // 5 minutes
}: UseAdaptivePollingOptions) {
  const [isActive, setIsActive] = useState(true)
  const lastActivityRef = useRef(Date.now())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Track user activity
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now()
      setIsActive(true)
    }
    
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      window.addEventListener(event, updateActivity)
    })
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity)
      })
    }
  }, [])
  
  // Check for inactivity
  useEffect(() => {
    const checkInactivity = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current
      if (timeSinceActivity > inactivityThreshold) {
        setIsActive(false)
      }
    }, 10000) // Check every 10 seconds
    
    return () => clearInterval(checkInactivity)
  }, [inactivityThreshold])
  
  // Polling logic
  useEffect(() => {
    // Don't poll if realtime is connected or not enabled or user is inactive
    if (realtimeConnected || !enabled || !isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }
    
    // Start polling
    console.log('[Polling] Starting fallback polling')
    intervalRef.current = setInterval(() => {
      console.log('[Polling] Fetching updates')
      onPoll()
    }, pollingInterval)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, realtimeConnected, isActive, pollingInterval, onPoll])
  
  return { isActive, isPolling: !realtimeConnected && enabled && isActive }
}
```

### Performance Monitoring

**File:** `src/lib/performance/monitor.ts`

```typescript
interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  metadata?: Record<string, unknown>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private enabled: boolean
  
  constructor() {
    this.enabled = process.env.NODE_ENV === 'development'
  }
  
  track(name: string, value: number, metadata?: Record<string, unknown>) {
    if (!this.enabled) return
    
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    }
    
    this.metrics.push(metric)
    
    // Log to console
    console.log(`[Performance] ${name}:`, value, metadata)
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }
  }
  
  trackCacheHit(queryKey: string, hit: boolean) {
    this.track('cache_hit', hit ? 1 : 0, { queryKey })
  }
  
  trackQueryTime(queryKey: string, duration: number) {
    this.track('query_duration', duration, { queryKey })
  }
  
  trackRenderTime(component: string, duration: number) {
    this.track('render_duration', duration, { component })
  }
  
  trackRealtimeConnection(connected: boolean) {
    this.track('realtime_connected', connected ? 1 : 0)
  }
  
  getMetrics() {
    return this.metrics
  }
  
  getAverageByName(name: string): number {
    const filtered = this.metrics.filter(m => m.name === name)
    if (filtered.length === 0) return 0
    
    const sum = filtered.reduce((acc, m) => acc + m.value, 0)
    return sum / filtered.length
  }
  
  getCacheHitRate(queryKey?: string): number {
    let filtered = this.metrics.filter(m => m.name === 'cache_hit')
    
    if (queryKey) {
      filtered = filtered.filter(m => m.metadata?.queryKey === queryKey)
    }
    
    if (filtered.length === 0) return 0
    
    const hits = filtered.filter(m => m.value === 1).length
    return hits / filtered.length
  }
}

export const performanceMonitor = new PerformanceMonitor()
```

**File:** `src/hooks/usePerformanceTracking.ts`

```typescript
import { useEffect, useRef } from 'react'
import { performanceMonitor } from '@/lib/performance/monitor'

export function usePerformanceTracking(componentName: string) {
  const renderStartRef = useRef(Date.now())
  
  useEffect(() => {
    const renderTime = Date.now() - renderStartRef.current
    performanceMonitor.trackRenderTime(componentName, renderTime)
  })
  
  return {
    trackEvent: (eventName: string, value: number, metadata?: Record<string, unknown>) => {
      performanceMonitor.track(`${componentName}_${eventName}`, value, metadata)
    },
  }
}
```

## Data Models

### Message Pagination State

```typescript
interface PaginationState {
  pages: MessagesPage[]
  pageParams: (string | null)[]
  hasNextPage: boolean
  isFetchingNextPage: boolean
}

interface MessagesPage {
  messages: Message[]
  nextCursor: string | null
  hasMore: boolean
}
```

### Cache Configuration

```typescript
interface CacheConfig {
  staleTime: number // Time before data is considered stale
  gcTime: number // Time before unused data is garbage collected
  refetchOnWindowFocus: boolean
  refetchOnReconnect: boolean
  retry: number
}

interface QueryKey {
  foods: readonly ['foods']
  categories: readonly ['categories']
  messages: (sessionId: string) => readonly ['messages', string]
  chatSessions: readonly ['chatSessions']
}
```

### Virtual Scrolling State

```typescript
interface VirtualItem {
  key: string | number
  index: number
  start: number // Pixel offset from top
  size: number // Height in pixels
  end: number // start + size
}

interface VirtualizerState {
  scrollOffset: number
  totalSize: number
  virtualItems: VirtualItem[]
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before defining properties, let me analyze which acceptance criteria are suitable for property-based testing:

### Acceptance Criteria Testing Prework

**Requirement 1: Caching Layer**
1.1. THE Cache_Layer SHALL store food catalog data in client-side cache using React Query
  - Thoughts: This is testing React Query integration and configuration, not pure logic. This is infrastructure setup.
  - Classification: INTEGRATION
  - Test Strategy: Verify React Query stores data after fetch with example-based tests

1.2. THE Cache_Layer SHALL store category data in client-side cache using React Query
  - Thoughts: Same as 1.1, this is React Query configuration
  - Classification: INTEGRATION
  - Test Strategy: Example-based test to verify caching behavior

1.3. WHEN a user visits the food catalog page, THE Food_Catalog SHALL serve data from cache if available
  - Thoughts: This tests cache hit behavior. We can test with different cache states (hit/miss)
  - Classification: EXAMPLE
  - Test Strategy: Test specific scenarios: cache hit, cache miss, stale cache

1.4. WHEN cached data is older than 5 minutes, THE Cache_Layer SHALL fetch fresh data in the background
  - Thoughts: This is time-based behavior testing React Query's staleTime configuration
  - Classification: EXAMPLE
  - Test Strategy: Mock time and verify refetch behavior

1.5. WHEN cached data is unavailable, THE Food_Catalog SHALL fetch data from the database
  - Thoughts: Testing fallback behavior, specific scenario
  - Classification: EXAMPLE
  - Test Strategy: Test cache miss scenario

1.6. THE Cache_Layer SHALL invalidate food cache when admin updates food items
  - Thoughts: Testing cache invalidation trigger, specific action
  - Classification: EXAMPLE
  - Test Strategy: Verify invalidation is called after update

1.7. THE Cache_Layer SHALL invalidate category cache when admin updates categories
  - Thoughts: Same as 1.6
  - Classification: EXAMPLE
  - Test Strategy: Verify invalidation is called after update

**Requirement 2: Message Pagination**
2.1. WHEN a chat session loads, THE Chat_System SHALL fetch only the most recent 50 messages
  - Thoughts: Testing initial page size, specific scenario
  - Classification: EXAMPLE
  - Test Strategy: Verify query limit is 50

2.2. WHEN a user scrolls to the top of the message list, THE Chat_System SHALL load the previous 50 messages
  - Thoughts: Testing pagination trigger and page size
  - Classification: EXAMPLE
  - Test Strategy: Verify fetchNextPage loads correct batch

2.3. THE Chat_System SHALL maintain scroll position after loading previous messages
  - Thoughts: This is UI behavior testing scroll position calculation. The calculation logic could be a property.
  - Classification: PROPERTY
  - Test Strategy: For any scroll position and new content height, verify position is maintained

2.4. WHEN all messages have been loaded, THE Chat_System SHALL display a visual indicator
  - Thoughts: UI rendering based on hasMore flag
  - Classification: EXAMPLE
  - Test Strategy: Verify indicator shows when hasMore is false

2.5. THE Chat_System SHALL apply pagination to both customer chat view and admin chat panel
  - Thoughts: Testing that both components use pagination
  - Classification: EXAMPLE
  - Test Strategy: Verify both components use the hook

2.6. FOR ALL paginated message loads, the total number of database queries SHALL be minimized through cursor-based pagination
  - Thoughts: This is about cursor calculation logic. For any set of messages, cursor should be the created_at of the last message.
  - Classification: PROPERTY
  - Test Strategy: For any page of messages, verify cursor is correctly calculated

**Requirement 3: Query Optimization**
3.1-3.4. Field selection in queries
  - Thoughts: These test that queries select specific fields. This is query construction, not pure logic.
  - Classification: EXAMPLE
  - Test Strategy: Verify query strings contain correct field selections

3.5. JOIN operations
  - Thoughts: Testing query construction strategy
  - Classification: EXAMPLE
  - Test Strategy: Verify JOINs are used where appropriate

**Requirement 4: Virtual Scrolling**
4.1. WHEN a message list contains more than 100 messages, THE Virtual_Scroller SHALL render only visible messages plus a buffer
  - Thoughts: This tests the virtual scrolling library configuration and behavior
  - Classification: INTEGRATION
  - Test Strategy: Verify virtualizer renders correct subset

4.2. THE Virtual_Scroller SHALL maintain smooth scrolling performance with lists of 1000+ messages
  - Thoughts: Performance test, not functional correctness
  - Classification: SMOKE
  - Test Strategy: Manual performance testing

4.3. THE Virtual_Scroller SHALL preserve message layout and spacing
  - Thoughts: UI rendering test
  - Classification: EXAMPLE
  - Test Strategy: Verify layout calculations are correct

4.4. WHEN new messages arrive, THE Virtual_Scroller SHALL append them without re-rendering the entire list
  - Thoughts: Testing React rendering optimization
  - Classification: EXAMPLE
  - Test Strategy: Use React testing tools to verify render count

4.5. THE Virtual_Scroller SHALL automatically scroll to bottom when new messages arrive from the current user
  - Thoughts: Testing scroll behavior logic. The decision logic (should scroll or not) could be a property.
  - Classification: PROPERTY
  - Test Strategy: For any scroll position and message sender, verify correct scroll behavior

**Requirement 5: Polling Optimization**
5.1. WHEN realtime connection is active, THE Chat_System SHALL disable polling fallback
  - Thoughts: Testing conditional logic based on connection state
  - Classification: EXAMPLE
  - Test Strategy: Verify polling stops when realtime connects

5.2. WHEN realtime connection fails, THE Chat_System SHALL enable polling with 30-second intervals
  - Thoughts: Testing fallback behavior
  - Classification: EXAMPLE
  - Test Strategy: Verify polling starts on disconnect

5.3. WHEN a user is inactive for 5 minutes, THE Chat_System SHALL pause polling
  - Thoughts: Testing inactivity detection logic. For any sequence of user events, verify correct active/inactive state.
  - Classification: PROPERTY
  - Test Strategy: For any event sequence and timestamps, verify inactivity is correctly detected

5.4. WHEN a user becomes active again, THE Chat_System SHALL resume polling immediately
  - Thoughts: Testing state transition
  - Classification: EXAMPLE
  - Test Strategy: Verify polling resumes on activity

5.5. THE Chat_System SHALL log polling status changes for monitoring
  - Thoughts: Testing logging side effect
  - Classification: EXAMPLE
  - Test Strategy: Verify log calls are made

**Requirement 6: Lazy Loading**
6.1-6.5. Admin chat panel lazy loading
  - Thoughts: These test React Query behavior and component lifecycle, not pure logic
  - Classification: INTEGRATION/EXAMPLE
  - Test Strategy: Example-based tests for each scenario

**Requirement 7: Performance Monitoring**
7.1-7.6. Performance metrics tracking
  - Thoughts: Testing metrics collection, which is side effects and state management
  - Classification: EXAMPLE
  - Test Strategy: Verify metrics are recorded correctly

### Property Reflection

After reviewing all testable properties identified:

**Identified Properties:**
1. Scroll position maintenance (2.3)
2. Cursor calculation (2.6)
3. Auto-scroll decision logic (4.5)
4. Inactivity detection (5.3)

**Reflection:**
- Property 1 (scroll position) and Property 3 (auto-scroll) are related but test different aspects - keep both
- Property 2 (cursor calculation) is a pure function - good candidate
- Property 4 (inactivity detection) is time-based logic - good candidate

All four properties provide unique validation value and should be kept.

### Property 1: Scroll Position Preservation

*For any* scroll position and content height before loading new messages, after loading previous messages and adjusting scroll offset, the visible content SHALL remain in the same position on screen.

**Validates: Requirements 2.3**

### Property 2: Cursor Calculation Correctness

*For any* non-empty page of messages ordered by created_at, the pagination cursor SHALL be the created_at timestamp of the last message in the page.

**Validates: Requirements 2.6**

### Property 3: Auto-Scroll Decision Logic

*For any* scroll position and viewport height, the system SHALL auto-scroll to bottom if and only if the user is within 100 pixels of the bottom before the new message arrives.

**Validates: Requirements 4.5**

### Property 4: Inactivity Detection Accuracy

*For any* sequence of user activity events with timestamps, the system SHALL correctly identify the user as inactive if and only if the time since the last activity event exceeds the inactivity threshold.

**Validates: Requirements 5.3**

## Error Handling

### Cache Errors

**Scenario:** React Query fetch fails
- **Handling:** Display cached data if available (stale-while-revalidate)
- **Fallback:** Show error message if no cached data exists
- **Recovery:** Retry with exponential backoff (1 retry by default)
- **User Feedback:** Toast notification for persistent errors

**Scenario:** Cache invalidation fails
- **Handling:** Log error but don't block user action
- **Fallback:** Next refetch will get fresh data
- **Recovery:** Automatic on next query
- **User Feedback:** Silent (non-critical)

### Pagination Errors

**Scenario:** Cursor-based query fails
- **Handling:** Keep existing messages displayed
- **Fallback:** Retry with same cursor
- **Recovery:** User can manually retry by scrolling
- **User Feedback:** "Failed to load more messages" banner

**Scenario:** Invalid cursor (message deleted)
- **Handling:** Reset to latest messages
- **Fallback:** Fetch from beginning
- **Recovery:** Automatic reset
- **User Feedback:** "Loading latest messages..."

**Scenario:** Network timeout during pagination
- **Handling:** Cancel request after 10 seconds
- **Fallback:** Keep current messages
- **Recovery:** Retry on next scroll
- **User Feedback:** Timeout message with retry button

### Virtual Scrolling Errors

**Scenario:** Virtualizer fails to calculate dimensions
- **Handling:** Fall back to regular scrolling
- **Fallback:** Render all messages (performance degradation)
- **Recovery:** Reload component
- **User Feedback:** Silent fallback

**Scenario:** Scroll position calculation error
- **Handling:** Reset to bottom
- **Fallback:** Disable auto-scroll temporarily
- **Recovery:** Re-enable on next manual scroll
- **User Feedback:** None (graceful degradation)

### Realtime Connection Errors

**Scenario:** Realtime subscription fails
- **Handling:** Enable polling fallback immediately
- **Fallback:** 30-second polling interval
- **Recovery:** Retry realtime connection every 60 seconds
- **User Feedback:** Console warning in development

**Scenario:** Polling fails repeatedly
- **Handling:** Exponential backoff (30s → 60s → 120s)
- **Fallback:** Manual refresh button
- **Recovery:** Reset interval on successful poll
- **User Feedback:** "Connection issues" indicator

### Performance Monitoring Errors

**Scenario:** Metric tracking throws error
- **Handling:** Catch and log, don't crash app
- **Fallback:** Continue without that metric
- **Recovery:** Next metric call will work
- **User Feedback:** None (development only)

## Testing Strategy

### Unit Tests

Unit tests focus on pure functions and isolated logic:

**Pagination Logic:**
- `calculateNextCursor(messages)` - verify cursor is last message's created_at
- `shouldLoadMore(scrollPosition, threshold)` - verify load trigger logic
- `mergePages(existingPages, newPage)` - verify page merging

**Scroll Position Logic:**
- `calculateScrollOffset(oldHeight, newHeight, oldScroll)` - verify position preservation
- `shouldAutoScroll(scrollTop, scrollHeight, clientHeight, threshold)` - verify auto-scroll decision
- `getVisibleRange(scrollOffset, viewportHeight, itemHeight)` - verify visible item calculation

**Inactivity Detection:**
- `isUserInactive(lastActivityTime, currentTime, threshold)` - verify inactivity logic
- `shouldEnablePolling(realtimeConnected, isActive)` - verify polling decision

**Cache Key Generation:**
- `generateQueryKey(type, params)` - verify consistent key generation
- `parseCacheKey(key)` - verify key parsing

**Performance Metrics:**
- `calculateCacheHitRate(metrics)` - verify calculation
- `getAverageMetric(metrics, name)` - verify aggregation

### Property-Based Tests

Property-based tests verify universal properties across many generated inputs. Each test should run minimum 100 iterations.

**Test Framework:** fast-check (JavaScript property-based testing library)

**Property Test 1: Scroll Position Preservation**
```typescript
// Feature: performance-optimization, Property 1: Scroll position preservation
fc.assert(
  fc.property(
    fc.nat(10000), // oldScrollTop
    fc.nat(50000), // oldScrollHeight
    fc.nat(5000),  // newContentHeight
    fc.nat(1000),  // viewportHeight
    (oldScrollTop, oldScrollHeight, newContentHeight, viewportHeight) => {
      const newScrollTop = calculateScrollOffset(
        oldScrollHeight,
        oldScrollHeight + newContentHeight,
        oldScrollTop
      )
      
      // The visible content should remain at the same position
      // This means the scroll offset should increase by exactly the new content height
      return newScrollTop === oldScrollTop + newContentHeight
    }
  ),
  { numRuns: 100 }
)
```

**Property Test 2: Cursor Calculation Correctness**
```typescript
// Feature: performance-optimization, Property 2: Cursor calculation correctness
fc.assert(
  fc.property(
    fc.array(
      fc.record({
        id: fc.uuid(),
        created_at: fc.date().map(d => d.toISOString()),
        content: fc.string(),
      }),
      { minLength: 1, maxLength: 100 }
    ),
    (messages) => {
      // Sort messages by created_at ascending (as they would be in a page)
      const sortedMessages = [...messages].sort(
        (a, b) => a.created_at.localeCompare(b.created_at)
      )
      
      const cursor = calculateNextCursor(sortedMessages)
      const lastMessage = sortedMessages[sortedMessages.length - 1]
      
      // Cursor should be the created_at of the last message
      return cursor === lastMessage.created_at
    }
  ),
  { numRuns: 100 }
)
```

**Property Test 3: Auto-Scroll Decision Logic**
```typescript
// Feature: performance-optimization, Property 3: Auto-scroll decision logic
fc.assert(
  fc.property(
    fc.nat(10000), // scrollTop
    fc.nat(50000), // scrollHeight
    fc.nat(1000),  // clientHeight
    (scrollTop, scrollHeight, clientHeight) => {
      fc.pre(scrollHeight >= clientHeight) // Precondition: content must be scrollable
      
      const threshold = 100
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      const shouldScroll = shouldAutoScroll(scrollTop, scrollHeight, clientHeight, threshold)
      
      // Should auto-scroll if and only if within threshold of bottom
      return shouldScroll === (distanceFromBottom < threshold)
    }
  ),
  { numRuns: 100 }
)
```

**Property Test 4: Inactivity Detection Accuracy**
```typescript
// Feature: performance-optimization, Property 4: Inactivity detection accuracy
fc.assert(
  fc.property(
    fc.date(), // lastActivityTime
    fc.date(), // currentTime
    fc.integer({ min: 60000, max: 600000 }), // threshold (1-10 minutes)
    (lastActivityTime, currentTime, threshold) => {
      fc.pre(currentTime >= lastActivityTime) // Precondition: current time must be after last activity
      
      const timeSinceActivity = currentTime.getTime() - lastActivityTime.getTime()
      const isInactive = isUserInactive(lastActivityTime.getTime(), currentTime.getTime(), threshold)
      
      // Should be inactive if and only if time since activity exceeds threshold
      return isInactive === (timeSinceActivity > threshold)
    }
  ),
  { numRuns: 100 }
)
```

### Integration Tests

Integration tests verify React Query integration, Supabase queries, and component behavior:

**Cache Integration:**
- Verify React Query stores data after fetch
- Verify stale data triggers background refetch
- Verify cache invalidation clears data
- Verify cache serves data on subsequent requests

**Pagination Integration:**
- Verify initial load fetches 50 messages
- Verify fetchNextPage loads previous 50
- Verify cursor is passed correctly to Supabase
- Verify hasMore flag is set correctly

**Virtual Scrolling Integration:**
- Verify virtualizer renders subset of messages
- Verify scroll events trigger range updates
- Verify new messages are appended correctly

**Realtime + Polling Integration:**
- Verify polling stops when realtime connects
- Verify polling starts when realtime disconnects
- Verify inactivity pauses polling
- Verify activity resumes polling

### Performance Tests

Performance tests verify optimization effectiveness:

**Cache Performance:**
- Measure cache hit rate (target: >80% for food/categories)
- Measure time to first render with cache (target: <100ms)
- Measure time to first render without cache (baseline)

**Pagination Performance:**
- Measure time to load 50 messages (target: <500ms)
- Measure memory usage with 1000 messages (target: <50MB)
- Compare with loading all messages at once (baseline)

**Virtual Scrolling Performance:**
- Measure scroll FPS with 1000 messages (target: 60fps)
- Measure render time for viewport update (target: <16ms)
- Compare with rendering all messages (baseline)

**Polling Performance:**
- Measure network requests per minute (target: <2 with realtime, 2 without)
- Measure polling pause on inactivity (verify 0 requests)

### Test Coverage Goals

- Unit test coverage: >80% for pure functions
- Integration test coverage: >70% for hooks and components
- Property test coverage: 100% for identified properties (4 properties)
- Performance test coverage: All optimization features

### Testing Tools

- **Unit/Integration:** Vitest + React Testing Library
- **Property-Based:** fast-check
- **Performance:** Chrome DevTools Performance tab, React DevTools Profiler
- **E2E:** Playwright (for full user flows)


## Implementation Notes

### Phase 1: Setup React Query (Priority: High)

**Dependencies to Install:**
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

**Steps:**
1. Create `src/lib/react-query/client.ts` with QueryClient configuration
2. Create `src/lib/react-query/provider.tsx` with QueryClientProvider wrapper
3. Wrap app in `src/app/layout.tsx` with ReactQueryProvider
4. Add React Query DevTools for development debugging

**Verification:**
- React Query DevTools should appear in development mode
- Console should show no React Query errors
- Test basic query with `useQuery` hook

### Phase 2: Implement Caching Hooks (Priority: High)

**Files to Create:**
- `src/hooks/useFoodCatalog.ts`
- `src/hooks/useCategories.ts`
- `src/hooks/useInvalidateFoodCache.ts`
- `src/hooks/useInvalidateCategoryCache.ts`

**Migration Strategy:**
1. Create new hooks alongside existing fetch logic
2. Update one component at a time to use new hooks
3. Test each component thoroughly before moving to next
4. Remove old fetch logic after all components migrated

**Components to Update:**
- `src/app/thuc-pham/page.tsx` (food catalog page)
- `src/components/admin/foods/page.tsx` (admin food management)
- Category-related components

**Verification:**
- Food catalog loads from cache on second visit
- Cache invalidation triggers refetch
- DevTools shows cache entries
- Network tab shows reduced requests

### Phase 3: Implement Message Pagination (Priority: High)

**Files to Create:**
- `src/hooks/useMessages.ts` (infinite query hook)
- `src/hooks/useInvalidateMessages.ts`
- `src/lib/pagination/utils.ts` (helper functions)

**Migration Strategy:**
1. Create `useMessages` hook with infinite query
2. Update `ChatContent.tsx` to use paginated hook
3. Add "Load More" UI at top of message list
4. Update `AdminChatPanel.tsx` to use paginated hook
5. Test scroll position preservation
6. Remove old message fetching logic

**Components to Update:**
- `src/app/chat/ChatContent.tsx`
- `src/components/admin/AdminChatPanel.tsx`

**Verification:**
- Initial load shows only 50 messages
- Scrolling to top loads previous 50
- Scroll position is maintained after load
- "No more messages" indicator appears when all loaded

### Phase 4: Implement Virtual Scrolling (Priority: Medium)

**Dependencies to Install:**
```bash
npm install @tanstack/react-virtual
```

**Files to Create:**
- `src/components/chat/VirtualMessageList.tsx`

**Migration Strategy:**
1. Create VirtualMessageList component
2. Test with mock data (1000+ messages)
3. Update ChatContent to use VirtualMessageList when message count > 100
4. Update AdminChatPanel to use VirtualMessageList when message count > 100
5. Test scroll performance with large datasets

**Verification:**
- Smooth scrolling with 1000+ messages
- Only visible messages + buffer are rendered
- Auto-scroll to bottom works correctly
- Load more pagination still works

### Phase 5: Optimize Polling (Priority: Medium)

**Files to Create:**
- `src/hooks/useAdaptivePolling.ts`
- `src/lib/activity/tracker.ts`

**Migration Strategy:**
1. Create useAdaptivePolling hook
2. Update ChatContent to use adaptive polling
3. Update AdminChatPanel to use adaptive polling
4. Test realtime connection detection
5. Test inactivity detection
6. Remove old polling logic

**Verification:**
- Polling stops when realtime connects
- Polling starts when realtime disconnects
- Polling pauses after 5 minutes of inactivity
- Polling resumes on user activity
- Console logs show polling status changes

### Phase 6: Add Performance Monitoring (Priority: Low)

**Files to Create:**
- `src/lib/performance/monitor.ts`
- `src/hooks/usePerformanceTracking.ts`

**Integration Points:**
1. Add cache hit tracking to all query hooks
2. Add query time tracking to Supabase client wrapper
3. Add render time tracking to major components
4. Add realtime connection tracking to chat components

**Verification:**
- Console shows performance metrics in development
- Cache hit rate is tracked and logged
- Query durations are tracked
- Render times are tracked

### Phase 7: Database Query Optimization (Priority: Medium)

**Files to Update:**
- All Supabase query calls to use explicit field selection
- Consider adding database indexes (Supabase dashboard)

**Optimization Checklist:**
- [ ] Message queries select only needed fields
- [ ] Food queries select only needed fields
- [ ] Category queries select only needed fields
- [ ] Chat session queries select only needed fields
- [ ] Add index on `chat_messages.session_id`
- [ ] Add index on `chat_messages.created_at`
- [ ] Add index on `foods.category_id`
- [ ] Add index on `foods.is_available`

**Verification:**
- Query response sizes are reduced
- Query execution times improve
- Database load decreases (monitor in Supabase dashboard)

### Rollback Strategy

Each phase can be rolled back independently:

**Phase 1 (React Query Setup):**
- Remove ReactQueryProvider from layout
- Uninstall @tanstack/react-query
- Components continue using old fetch logic

**Phase 2 (Caching Hooks):**
- Revert components to old fetch logic
- Remove hook files
- React Query still available for other features

**Phase 3 (Pagination):**
- Revert to fetching all messages
- Remove useMessages hook
- Keep React Query for caching

**Phase 4 (Virtual Scrolling):**
- Remove VirtualMessageList component
- Revert to regular message list rendering
- Pagination still works

**Phase 5 (Polling Optimization):**
- Revert to simple polling logic
- Remove useAdaptivePolling hook
- Keep existing polling interval

**Phase 6 (Performance Monitoring):**
- Remove performance tracking calls
- Remove monitor files
- No impact on functionality

**Phase 7 (Query Optimization):**
- Revert to `select('*')` queries
- Remove database indexes if causing issues
- No breaking changes

### Performance Targets

**Cache Performance:**
- Cache hit rate: >80% for food/categories
- Time to first render (cached): <100ms
- Time to first render (uncached): <500ms

**Pagination Performance:**
- Initial message load: <500ms
- Subsequent page load: <300ms
- Memory usage (1000 messages): <50MB

**Virtual Scrolling Performance:**
- Scroll FPS: 60fps (16ms per frame)
- Render time per viewport update: <16ms
- Memory usage: <10MB overhead

**Polling Performance:**
- Network requests (realtime active): 0 polls/minute
- Network requests (realtime inactive): 2 polls/minute
- Polling pause on inactivity: 100% effective

### Monitoring and Alerts

**Development Monitoring:**
- React Query DevTools for cache inspection
- Console logs for performance metrics
- Chrome DevTools Performance tab for profiling

**Production Monitoring (Future):**
- Track cache hit rates via analytics
- Monitor query response times
- Track realtime connection success rate
- Alert on performance degradation

### Migration Timeline

**Week 1:**
- Phase 1: React Query setup (1 day)
- Phase 2: Caching hooks (2 days)
- Testing and verification (2 days)

**Week 2:**
- Phase 3: Message pagination (3 days)
- Testing and verification (2 days)

**Week 3:**
- Phase 4: Virtual scrolling (2 days)
- Phase 5: Polling optimization (2 days)
- Testing and verification (1 day)

**Week 4:**
- Phase 6: Performance monitoring (1 day)
- Phase 7: Query optimization (2 days)
- Final testing and documentation (2 days)

### Dependencies and Risks

**Dependencies:**
- @tanstack/react-query: Stable, well-maintained
- @tanstack/react-virtual: Stable, well-maintained
- fast-check: Stable, for property-based testing

**Risks:**

**Risk 1: React Query Learning Curve**
- **Impact:** Medium
- **Probability:** Medium
- **Mitigation:** Thorough documentation, team training, gradual rollout

**Risk 2: Virtual Scrolling Complexity**
- **Impact:** Medium
- **Probability:** Low
- **Mitigation:** Fallback to regular scrolling if issues occur, thorough testing

**Risk 3: Pagination Breaking Realtime Updates**
- **Impact:** High
- **Probability:** Low
- **Mitigation:** Careful integration testing, keep realtime separate from pagination

**Risk 4: Cache Invalidation Bugs**
- **Impact:** Medium
- **Probability:** Medium
- **Mitigation:** Comprehensive testing, conservative invalidation strategy

**Risk 5: Performance Regression**
- **Impact:** High
- **Probability:** Low
- **Mitigation:** Performance testing before/after, rollback plan, gradual rollout

### Success Criteria

**Functional Success:**
- [ ] All features work as before (no regressions)
- [ ] Food catalog loads from cache on repeat visits
- [ ] Messages load in pages of 50
- [ ] Virtual scrolling works smoothly with 1000+ messages
- [ ] Polling adapts to realtime connection status
- [ ] Performance metrics are tracked

**Performance Success:**
- [ ] Cache hit rate >80% for food/categories
- [ ] Initial page load time reduced by >30%
- [ ] Memory usage with 1000 messages <50MB
- [ ] Scroll FPS maintained at 60fps
- [ ] Database queries reduced by >50%

**Quality Success:**
- [ ] Unit test coverage >80%
- [ ] Property tests pass 100 iterations
- [ ] Integration tests cover all hooks
- [ ] No console errors in production
- [ ] Performance monitoring shows improvements

