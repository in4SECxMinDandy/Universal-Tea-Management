import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  AUTO_SCROLL_THRESHOLD,
  calculateNextCursor,
  calculateScrollOffset,
  isUserInactive,
  shouldAutoScroll,
  shouldEnablePolling,
  shouldLoadMore,
} from './utils'

describe('pagination utilities', () => {
  it('preserves scroll position by adding the prepended content height', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000 }),
        fc.integer({ min: 0, max: 50_000 }),
        fc.integer({ min: 0, max: 10_000 }),
        (previousScrollTop, previousScrollHeight, addedHeight) => {
          const nextScrollHeight = previousScrollHeight + addedHeight
          expect(calculateScrollOffset(previousScrollHeight, nextScrollHeight, previousScrollTop))
            .toBe(previousScrollTop + addedHeight)
        }
      )
    )
  })

  it('uses the last message created_at value as the next cursor', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            created_at: fc
              .integer({
                min: Date.parse('2020-01-01T00:00:00Z'),
                max: Date.parse('2030-01-01T00:00:00Z'),
              })
              .map((timestamp) => new Date(timestamp).toISOString()),
          }),
          { minLength: 1, maxLength: 100 }
        ),
        (messages) => {
          expect(calculateNextCursor(messages)).toEqual({
            created_at: messages[messages.length - 1].created_at,
            id: messages[messages.length - 1].id,
          })
        }
      )
    )
  })

  it('triggers load more only near the top', () => {
    expect(shouldLoadMore(0)).toBe(true)
    expect(shouldLoadMore(16)).toBe(true)
    expect(shouldLoadMore(80)).toBe(false)
  })

  it('auto-scrolls iff the user is within the bottom threshold', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50_000 }),
        fc.integer({ min: 1, max: 2_000 }),
        fc.integer({ min: 0, max: 50_000 }),
        (scrollHeight, clientHeight, rawScrollTop) => {
          fc.pre(scrollHeight >= clientHeight)
          const maxScrollTop = scrollHeight - clientHeight
          const scrollTop = Math.min(rawScrollTop, maxScrollTop)
          const distance = scrollHeight - scrollTop - clientHeight

          expect(shouldAutoScroll(scrollTop, scrollHeight, clientHeight, AUTO_SCROLL_THRESHOLD))
            .toBe(distance <= AUTO_SCROLL_THRESHOLD)
        }
      )
    )
  })

  it('detects inactivity only after the configured threshold', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 1, max: 600_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (lastActivity, threshold, elapsed) => {
          const now = lastActivity + elapsed
          expect(isUserInactive(lastActivity, now, threshold)).toBe(elapsed > threshold)
        }
      )
    )
  })

  it('enables fallback polling only when realtime is disconnected and user is active', () => {
    expect(shouldEnablePolling({ enabled: true, realtimeConnected: false, isActive: true })).toBe(true)
    expect(shouldEnablePolling({ enabled: true, realtimeConnected: true, isActive: true })).toBe(false)
    expect(shouldEnablePolling({ enabled: true, realtimeConnected: false, isActive: false })).toBe(false)
    expect(shouldEnablePolling({ enabled: false, realtimeConnected: false, isActive: true })).toBe(false)
  })
})
