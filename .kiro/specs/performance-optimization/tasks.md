# Implementation Plan: Performance Optimization

## Overview

This implementation plan breaks down the performance optimization feature into 7 phases: React Query setup, caching hooks, message pagination, virtual scrolling, adaptive polling, performance monitoring, and database query optimization. Each phase builds incrementally on the previous work, with checkpoints to ensure stability before proceeding.

## Tasks

- [ ] 1. Set up React Query infrastructure
  - Install @tanstack/react-query and @tanstack/react-query-devtools packages
  - Create QueryClient configuration with 5-minute staleTime and proper defaults
  - Create ReactQueryProvider wrapper component
  - Wrap application in ReactQueryProvider in root layout
  - Verify React Query DevTools appears in development mode
  - _Requirements: 1.1, 1.2_

- [ ] 2. Implement caching layer for food catalog and categories
  - [ ] 2.1 Create useFoodCatalog hook with React Query
    - Implement useQuery hook that fetches food items with explicit field selection
    - Configure 5-minute staleTime for food catalog cache
    - Implement useInvalidateFoodCache hook for cache invalidation
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 3.2_
  
  - [ ] 2.2 Create useCategories hook with React Query
    - Implement useQuery hook that fetches categories with explicit field selection
    - Configure 5-minute staleTime for category cache
    - Implement useInvalidateCategoryCache hook for cache invalidation
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.7, 3.3_
  
  - [ ] 2.3 Migrate food catalog page to use caching hooks
    - Update src/app/thuc-pham/page.tsx to use useFoodCatalog hook
    - Update src/app/thuc-pham/page.tsx to use useCategories hook
    - Remove old direct Supabase fetch logic
    - _Requirements: 1.3, 1.5_
  
  - [ ] 2.4 Migrate admin food management to use caching hooks
    - Update src/app/admin/foods/page.tsx to use useFoodCatalog hook
    - Call useInvalidateFoodCache after admin updates food items
    - Call useInvalidateCategoryCache after admin updates categories
    - _Requirements: 1.6, 1.7_
  
  - [ ]* 2.5 Write unit tests for cache invalidation logic
    - Test cache invalidation is called after food updates
    - Test cache invalidation is called after category updates
    - Test cache serves stale data while revalidating
    - _Requirements: 1.6, 1.7_

- [ ] 3. Checkpoint - Verify caching works correctly
  - Ensure all tests pass, verify cache hit behavior in DevTools, ask the user if questions arise.

- [ ] 4. Implement cursor-based message pagination
  - [ ] 4.1 Create useMessages hook with infinite query
    - Implement useInfiniteQuery with cursor-based pagination
    - Configure PAGE_SIZE constant as 50 messages
    - Implement cursor calculation using created_at of last message
    - Implement getNextPageParam to return nextCursor
    - Select only id, sender_id, sender_role, content, image_url, created_at fields
    - _Requirements: 2.1, 2.2, 2.6, 3.1_
  
  - [ ]* 4.2 Write property test for cursor calculation
    - **Property 2: Cursor Calculation Correctness**
    - **Validates: Requirements 2.6**
    - For any non-empty page of messages, verify cursor is created_at of last message
    - Use fast-check to generate message arrays with timestamps
    - _Requirements: 2.6_
  
  - [ ] 4.3 Create pagination utility functions
    - Implement calculateScrollOffset for scroll position preservation
    - Implement shouldLoadMore for pagination trigger detection
    - Create helper functions in src/lib/pagination/utils.ts
    - _Requirements: 2.3_
  
  - [ ]* 4.4 Write property test for scroll position preservation
    - **Property 1: Scroll Position Preservation**
    - **Validates: Requirements 2.3**
    - For any scroll position and content height, verify visible content remains in same position after loading
    - Use fast-check to generate scroll positions and heights
    - _Requirements: 2.3_
  
  - [ ] 4.5 Migrate ChatContent component to use pagination
    - Update src/app/chat/ChatContent.tsx to use useMessages hook
    - Implement "Load More" UI at top of message list
    - Implement scroll position preservation after loading previous messages
    - Display "No more messages" indicator when hasMore is false
    - Remove old message fetching logic
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ] 4.6 Migrate AdminChatPanel component to use pagination
    - Update src/components/admin/AdminChatPanel.tsx to use useMessages hook
    - Implement "Load More" UI for admin panel
    - Apply same pagination behavior as customer chat
    - _Requirements: 2.5_
  
  - [ ]* 4.7 Write integration tests for message pagination
    - Test initial load fetches 50 messages
    - Test fetchNextPage loads previous 50 messages
    - Test cursor is passed correctly to Supabase query
    - Test hasMore flag is set correctly when all messages loaded
    - _Requirements: 2.1, 2.2, 2.4, 2.6_

- [ ] 5. Checkpoint - Verify pagination works correctly
  - Ensure all tests pass, verify scroll position is maintained, ask the user if questions arise.

- [ ] 6. Implement virtual scrolling for large message lists
  - [ ] 6.1 Create VirtualMessageList component
    - Install @tanstack/react-virtual package
    - Implement VirtualMessageList component using useVirtualizer hook
    - Configure 80px estimated message height and 20-item overscan
    - Implement scroll event handling for load more trigger
    - Implement auto-scroll to bottom for new messages
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 6.2 Write property test for auto-scroll decision logic
    - **Property 3: Auto-Scroll Decision Logic**
    - **Validates: Requirements 4.5**
    - For any scroll position and viewport height, verify auto-scroll occurs if and only if within 100px of bottom
    - Use fast-check to generate scroll positions and dimensions
    - _Requirements: 4.5_
  
  - [ ] 6.3 Integrate VirtualMessageList into ChatContent
    - Update ChatContent to use VirtualMessageList when message count > 100
    - Pass renderMessage function to VirtualMessageList
    - Pass onLoadMore callback for pagination integration
    - Maintain existing message rendering logic for lists < 100 messages
    - _Requirements: 4.1, 4.4, 4.5_
  
  - [ ] 6.4 Integrate VirtualMessageList into AdminChatPanel
    - Update AdminChatPanel to use VirtualMessageList when message count > 100
    - Apply same virtual scrolling behavior as customer chat
    - _Requirements: 4.1_
  
  - [ ]* 6.5 Write integration tests for virtual scrolling
    - Test virtualizer renders only visible messages plus buffer
    - Test scroll events trigger range updates
    - Test new messages are appended without full re-render
    - Test auto-scroll to bottom works correctly
    - _Requirements: 4.1, 4.4, 4.5_

- [ ] 7. Checkpoint - Verify virtual scrolling performance
  - Ensure all tests pass, test with 1000+ messages, ask the user if questions arise.

- [ ] 8. Implement adaptive polling optimization
  - [ ] 8.1 Create useAdaptivePolling hook
    - Implement user activity tracking (mousedown, keydown, scroll, touchstart events)
    - Implement inactivity detection with 5-minute threshold
    - Implement polling logic that disables when realtime is connected
    - Implement polling logic that enables with 30-second interval when realtime disconnects
    - Implement polling pause when user is inactive
    - Add console logging for polling status changes
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 8.2 Write property test for inactivity detection
    - **Property 4: Inactivity Detection Accuracy**
    - **Validates: Requirements 5.3**
    - For any sequence of activity events with timestamps, verify inactivity is correctly detected
    - Use fast-check to generate event sequences and timestamps
    - _Requirements: 5.3_
  
  - [ ] 8.3 Integrate adaptive polling into ChatContent
    - Update ChatContent to use useAdaptivePolling hook
    - Pass realtime connection status to hook
    - Remove old polling logic
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ] 8.4 Integrate adaptive polling into AdminChatPanel
    - Update AdminChatPanel to use useAdaptivePolling hook
    - Apply same polling behavior as customer chat
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 8.5 Write integration tests for adaptive polling
    - Test polling stops when realtime connects
    - Test polling starts when realtime disconnects
    - Test polling pauses after 5 minutes of inactivity
    - Test polling resumes on user activity
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 9. Implement lazy loading for admin chat panel
  - [ ] 9.1 Update admin chat panel to lazy load messages
    - Modify admin chat page to not fetch messages on initial load
    - Fetch messages only when admin opens a specific chat session
    - Unsubscribe from realtime updates when admin closes a chat session
    - Configure 2-minute cache time for recently viewed sessions
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 9.2 Write integration tests for lazy loading
    - Test messages are not fetched on admin page load
    - Test messages are fetched when session is opened
    - Test realtime unsubscribe when session is closed
    - Test cache serves data for recently viewed sessions
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ] 10. Checkpoint - Verify polling and lazy loading work correctly
  - Ensure all tests pass, verify polling behavior in console, ask the user if questions arise.

- [ ] 11. Add performance monitoring
  - [ ] 11.1 Create performance monitoring infrastructure
    - Create PerformanceMonitor class in src/lib/performance/monitor.ts
    - Implement metric tracking methods (track, trackCacheHit, trackQueryTime, trackRenderTime)
    - Implement metric aggregation methods (getAverageByName, getCacheHitRate)
    - Enable monitoring only in development mode
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ] 11.2 Create usePerformanceTracking hook
    - Implement hook that tracks component render times
    - Export trackEvent function for custom metrics
    - _Requirements: 7.4_
  
  - [ ] 11.3 Integrate performance tracking into query hooks
    - Add cache hit tracking to useFoodCatalog hook
    - Add cache hit tracking to useCategories hook
    - Add query time tracking to useMessages hook
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 11.4 Integrate performance tracking into chat components
    - Add render time tracking to ChatContent component
    - Add render time tracking to VirtualMessageList component
    - Add realtime connection tracking to chat components
    - _Requirements: 7.4, 7.5_
  
  - [ ]* 11.5 Write unit tests for performance monitoring
    - Test metric tracking records correct values
    - Test cache hit rate calculation
    - Test average metric calculation
    - Test metrics are only tracked in development mode
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 12. Optimize database queries with explicit field selection
  - [ ] 12.1 Audit and optimize all Supabase queries
    - Update all message queries to select only required fields
    - Update all food queries to select only required fields
    - Update all category queries to select only required fields
    - Update all chat session queries to select only required fields
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ] 12.2 Add database indexes for frequently queried fields
    - Document recommended indexes: chat_messages.session_id, chat_messages.created_at
    - Document recommended indexes: foods.category_id, foods.is_available
    - Create migration file or documentation for index creation
    - _Requirements: 3.4_
  
  - [ ]* 12.3 Write integration tests for query optimization
    - Test queries select only specified fields
    - Test query response sizes are reduced
    - Verify no regressions in query functionality
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 13. Final checkpoint and verification
  - Run all tests (unit, property, integration)
  - Verify all performance targets are met (cache hit rate >80%, scroll FPS 60fps)
  - Verify no console errors in development or production builds
  - Test complete user flows: food catalog browsing, chat messaging, admin panel
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and allow for course correction
- Property tests validate universal correctness properties using fast-check
- Integration tests verify React Query, Supabase, and component interactions
- The implementation follows a 7-phase approach: setup, caching, pagination, virtual scrolling, polling, monitoring, query optimization
- Each phase can be rolled back independently if issues arise
- Performance targets: cache hit rate >80%, initial load <500ms, scroll FPS 60fps, memory <50MB for 1000 messages
