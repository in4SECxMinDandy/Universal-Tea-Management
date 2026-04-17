'use client'

import { useEffect, useRef } from 'react'

import { performanceMonitor } from '@/lib/performance/monitor'

export function usePerformanceTracking(name: string) {
  const lastCommitAtRef = useRef(0)

  useEffect(() => {
    const now = performance.now()
    const renderTime = lastCommitAtRef.current > 0 ? now - lastCommitAtRef.current : 0
    performanceMonitor.trackRenderTime(name, renderTime)
    lastCommitAtRef.current = now
  })

  return {
    trackEvent(eventName: string, value = 1, meta?: Record<string, unknown>) {
      performanceMonitor.track(`${name}:${eventName}`, value, meta)
    },
  }
}
