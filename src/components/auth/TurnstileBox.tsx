'use client'

import { useEffect, useRef } from 'react'

interface TurnstileWindow extends Window {
  turnstile?: {
    render: (el: HTMLElement, opts: Record<string, unknown>) => string
    remove: (widgetId: string) => void
  }
}

export function TurnstileBox({
  siteKey,
  onToken,
}: {
  siteKey: string
  onToken: (token: string | null) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onTokenRef = useRef<(token: string | null) => void>(() => {})

  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  useEffect(() => {
    if (!siteKey || !containerRef.current) return

    let cancelled = false
    let widgetId: string | undefined

    const loadScript = (): Promise<void> =>
      new Promise((resolve, reject) => {
        const w = window as TurnstileWindow
        if (w.turnstile) {
          resolve()
          return
        }
        const existing = document.querySelector<HTMLScriptElement>(
          'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]'
        )
        if (existing) {
          existing.addEventListener('load', () => resolve(), { once: true })
          existing.addEventListener('error', () => reject(new Error('Turnstile script failed')), { once: true })
          return
        }
        const s = document.createElement('script')
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
        s.async = true
        s.onload = () => resolve()
        s.onerror = () => reject(new Error('Turnstile script failed'))
        document.head.appendChild(s)
      })

    void (async () => {
      try {
        await loadScript()
      } catch {
        onTokenRef.current(null)
        return
      }
      if (cancelled || !containerRef.current) return
      const w = window as TurnstileWindow
      if (!w.turnstile) {
        onTokenRef.current(null)
        return
      }
      widgetId = w.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onTokenRef.current(token),
        'expired-callback': () => onTokenRef.current(null),
        'error-callback': () => onTokenRef.current(null),
      })
    })()

    return () => {
      cancelled = true
      const w = window as TurnstileWindow
      if (widgetId && w.turnstile) {
        try {
          w.turnstile.remove(widgetId)
        } catch {
          /* ignore */
        }
      }
    }
  }, [siteKey])

  return <div ref={containerRef} className="flex justify-center min-h-[65px]" />
}
