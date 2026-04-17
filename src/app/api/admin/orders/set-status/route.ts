import { NextResponse } from 'next/server'

import { buildRateLimitHeaders, rateLimit } from '@/lib/middleware/rateLimit'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const setStatusLimiter = rateLimit({
  windowMs: 60_000,
  maxRequests: 30,
  keyPrefix: 'admin-orders-set-status',
})

const setStatusSchema = z.object({
  order_id: z.string().uuid('Order khong hop le.'),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
})

export async function POST(request: Request) {
  const rateLimitResult = await setStatusLimiter(request)

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid body' },
      { status: 400, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  const validation = setStatusSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0]?.message ?? 'Invalid payload' },
      { status: 400, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  const supabase = await createClient()
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  const { data: hasRole } = await supabase.rpc('has_role', {
    uid: session.user.id,
    role_name: 'STORE_ADMIN',
  })

  if (hasRole !== true) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status: validation.data.status })
    .eq('id', validation.data.order_id)
    .select('id, status')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update order' },
      { status: 500, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  return NextResponse.json(
    { success: true, order: data },
    { status: 200, headers: buildRateLimitHeaders(rateLimitResult) }
  )
}
