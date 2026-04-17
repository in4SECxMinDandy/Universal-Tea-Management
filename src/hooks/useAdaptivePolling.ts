'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import {
  FALLBACK_POLLING_INTERVAL_MS,
  INACTIVITY_THRESHOLD_MS,
  isUserInactive,
  shouldEnablePolling,
} from '@/lib/pagination/utils'

interface UseAdaptivePollingOptions {
  enabled: boolean
  realtimeConnected: boolean
  onPoll: () => void | Promise<void>
  pollingInterval?: number
  inactivityThreshold?: number
}

export function useAdaptivePolling({
  enabled,
  realtimeConnected,
  onPoll,
  pollingInterval = FALLBACK_POLLING_INTERVAL_MS,
  inactivityThreshold = INACTIVITY_THRESHOLD_MS,
}: UseAdaptivePollingOptions) {
  const [isActive, setIsActive] = useState(true)
  const lastActivityRef = useRef(0)
  const onPollRef = useRef(onPoll)

  useEffect(() => {
    onPollRef.current = onPoll
  }, [onPoll])

  useEffect(() => {
    lastActivityRef.current = Date.now()

    const markActive = () => {
      lastActivityRef.current = Date.now()
      setIsActive(true)
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach((event) => window.addEventListener(event, markActive, { passive: true }))

    const activityCheck = window.setInterval(() => {
      setIsActive(!isUserInactive(lastActivityRef.current, Date.now(), inactivityThreshold))
    }, Math.min(30_000, inactivityThreshold))

    return () => {
      events.forEach((event) => window.removeEventListener(event, markActive))
      window.clearInterval(activityCheck)
    }
  }, [inactivityThreshold])

  const pollingEnabled = useMemo(
    () => shouldEnablePolling({ enabled, realtimeConnected, isActive }),
    [enabled, realtimeConnected, isActive]
  )

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(
        `[polling] ${pollingEnabled ? 'enabled' : 'disabled'} ` +
          `(realtime=${realtimeConnected ? 'connected' : 'disconnected'}, active=${isActive})`
      )
    }

    if (!pollingEnabled) return

    const interval = window.setInterval(() => {
      void onPollRef.current()
    }, pollingInterval)

    return () => window.clearInterval(interval)
  }, [isActive, pollingEnabled, pollingInterval, realtimeConnected])

  return { isActive, isPolling: pollingEnabled }
}
