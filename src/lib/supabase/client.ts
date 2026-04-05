import { createBrowserClient } from '@supabase/ssr'

function createLoggingFetch() {
  const originalFetch = globalThis.fetch.bind(globalThis)
  return async function loggingFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const isAuthRequest =
      typeof url === 'string' &&
      (url.includes('/auth/v1/token') || url.includes('/auth/v1/user'))

    if (isAuthRequest) {
      const bodyPreview =
        typeof init?.body === 'string'
          ? init.body.length > 200
            ? init.body.substring(0, 200) + '...'
            : init.body
          : '[not a string body]'

      const logData = {
        url,
        method: init?.method ?? 'GET',
        statusWillBe: 'captured on response',
        bodyPreview,
      }

      // Log request
      fetch('/api/debug/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: '6649c4',
          location: 'auth-fetch',
          message: 'AUTH_REQUEST',
          data: logData,
          runId: 'auth-debug',
          hypothesisId: 'H5',
          timestamp: Date.now(),
        }),
      }).catch(() => {})

      // Intercept response for logging
      const response = await originalFetch(input, init)
      let clonedBody: string | null = null

      if (isAuthRequest) {
        try {
          clonedBody = await response.clone().text()
        } catch {
          clonedBody = '[could not clone/read body]'
        }

        const logData = {
          url,
          status: response.status,
          statusText: response.statusText,
          body: clonedBody,
        }

        fetch('/api/debug/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: '6649c4',
            location: 'auth-fetch',
            message: 'AUTH_RESPONSE',
            data: logData,
            runId: 'auth-debug',
            hypothesisId: 'H5',
            timestamp: Date.now(),
          }),
        }).catch(() => {})
      }

      // Return the original response (with readable body) back to caller
      if (clonedBody !== null) {
        return new Response(clonedBody, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        })
      }
      return response
    }

    return originalFetch(input, init)
  }
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: createLoggingFetch(),
      },
    }
  )
}
