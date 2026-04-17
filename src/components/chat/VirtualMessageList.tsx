'use client'
/* eslint-disable react-hooks/incompatible-library */

import { RefObject } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

interface VirtualMessageListProps<T> {
  messages: T[]
  scrollParentRef: RefObject<HTMLDivElement | null>
  renderMessage: (message: T, index: number) => React.ReactNode
  estimateSize?: number
}

export function VirtualMessageList<T>({
  messages,
  scrollParentRef,
  renderMessage,
  estimateSize = 88,
}: VirtualMessageListProps<T>) {
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => estimateSize,
    overscan: 20,
  })

  return (
    <div
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {virtualizer.getVirtualItems().map((item) => (
        <div
          key={item.key}
          ref={virtualizer.measureElement}
          data-index={item.index}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${item.start}px)`,
          }}
        >
          {renderMessage(messages[item.index], item.index)}
        </div>
      ))}
    </div>
  )
}
