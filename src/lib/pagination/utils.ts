import type { ChatMessage, ChatMessageCursor } from '@/lib/types'

export const MESSAGE_PAGE_SIZE = 50
export const LOAD_MORE_SCROLL_THRESHOLD = 32
export const AUTO_SCROLL_THRESHOLD = 100
export const INACTIVITY_THRESHOLD_MS = 5 * 60 * 1000
export const FALLBACK_POLLING_INTERVAL_MS = 30 * 1000

export function calculateNextCursor(messages: Pick<ChatMessage, 'created_at' | 'id'>[]): ChatMessageCursor | null {
  if (messages.length === 0) return null
  return {
    created_at: messages[messages.length - 1].created_at,
    id: messages[messages.length - 1].id,
  }
}

export function calculateScrollOffset(
  previousScrollHeight: number,
  nextScrollHeight: number,
  previousScrollTop: number
) {
  return previousScrollTop + Math.max(nextScrollHeight - previousScrollHeight, 0)
}

export function shouldLoadMore(scrollTop: number, threshold = LOAD_MORE_SCROLL_THRESHOLD) {
  return scrollTop <= threshold
}

export function shouldAutoScroll(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
  threshold = AUTO_SCROLL_THRESHOLD
) {
  return scrollHeight - scrollTop - clientHeight <= threshold
}

export function isUserInactive(
  lastActivityTime: number,
  currentTime: number,
  threshold = INACTIVITY_THRESHOLD_MS
) {
  return currentTime - lastActivityTime > threshold
}

export function shouldEnablePolling({
  enabled,
  realtimeConnected,
  isActive,
}: {
  enabled: boolean
  realtimeConnected: boolean
  isActive: boolean
}) {
  return enabled && !realtimeConnected && isActive
}

export function mergeMessagePages<T extends ChatMessage>(
  pages: { messages: T[] }[] | undefined
) {
  if (!pages) return []
  return pages
    .slice()
    .reverse()
    .flatMap((page) => page.messages.slice().reverse())
}
