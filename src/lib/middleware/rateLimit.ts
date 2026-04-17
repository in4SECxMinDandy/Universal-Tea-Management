type RateLimitRequest = {
  headers: Headers
  url?: string
  nextUrl?: { pathname: string }
}

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyPrefix?: string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

type RateLimitRecord = {
  count: number
  resetTime: number
}

const requestCounts = new Map<string, RateLimitRecord>()

function cleanupExpiredEntries(now: number) {
  for (const [key, record] of requestCounts.entries()) {
    if (record.resetTime <= now) {
      requestCounts.delete(key)
    }
  }
}

function getRequestPath(request: RateLimitRequest) {
  if (request.nextUrl?.pathname) {
    return request.nextUrl.pathname
  }

  if (request.url) {
    return new URL(request.url).pathname
  }

  return 'unknown-path'
}

export function getClientIp(request: RateLimitRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

export function buildRateLimitHeaders(result: RateLimitResult) {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetTime),
  }
}

export function resetRateLimitStore() {
  requestCounts.clear()
}

function consumeRateLimitInMemory(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  cleanupExpiredEntries(now)

  const existing = requestCounts.get(key)

  if (!existing || existing.resetTime <= now) {
    const nextRecord = {
      count: 1,
      resetTime: now + config.windowMs,
    }

    requestCounts.set(key, nextRecord)

    return {
      success: true,
      limit: config.maxRequests,
      remaining: Math.max(config.maxRequests - 1, 0),
      resetTime: nextRecord.resetTime,
    }
  }

  if (existing.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: existing.resetTime,
    }
  }

  existing.count += 1

  return {
    success: true,
    limit: config.maxRequests,
    remaining: Math.max(config.maxRequests - existing.count, 0),
    resetTime: existing.resetTime,
  }
}

async function consumeRateLimitWithSupabase(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('consume_rate_limit', {
      p_key: key,
      p_window_ms: config.windowMs,
      p_max_requests: config.maxRequests,
    })

    if (error) {
      throw error
    }

    const row = Array.isArray(data) ? data[0] : data

    if (!row) {
      throw new Error('Missing rate limit response')
    }

    return {
      success: row.success,
      limit: row.limit,
      remaining: row.remaining,
      resetTime: row.reset_time,
    }
  } catch (error) {
    console.error('[rateLimit] distributed limiter unavailable, falling back to memory', error)
    return null
  }
}

export function rateLimit(config: RateLimitConfig) {
  return async (request: RateLimitRequest): Promise<RateLimitResult> => {
    const ip = getClientIp(request)
    const path = getRequestPath(request)
    const key = `${config.keyPrefix ?? path}:${ip}`

    if (process.env.NODE_ENV !== 'test') {
      const distributedResult = await consumeRateLimitWithSupabase(key, config)
      if (distributedResult) {
        return distributedResult
      }
    }

    return consumeRateLimitInMemory(key, config)
  }
}
