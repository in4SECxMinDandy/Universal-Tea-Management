import { NextResponse } from 'next/server'

import { buildRateLimitHeaders, rateLimit } from '@/lib/middleware/rateLimit'
import { createClient } from '@/lib/supabase/server'
import { orderCreateSchema } from '@/lib/validation/schemas'

const orderLimiter = rateLimit({
  windowMs: 60_000,
  maxRequests: 10,
  keyPrefix: 'orders-create',
})

function mapOrderErrorToStatus(message: string) {
  if (message === 'Unauthorized') return 401
  if (message === 'Admins cannot place orders') return 403
  if (message === 'Food not found') return 404
  if (message === 'Food unavailable' || message === 'Insufficient stock') return 409
  if (message === 'Invalid quantity') return 400
  return 500
}

export async function POST(request: Request) {
  const rateLimitResult = await orderLimiter(request)

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Ban da dat hang qua nhieu lan. Vui long thu lai sau.' },
      { status: 429, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Du lieu dat hang khong hop le.' },
      { status: 400, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  const validation = orderCreateSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      {
        error: validation.error.issues[0]?.message ?? 'Thong tin dat hang khong hop le.',
        details: validation.error.flatten(),
      },
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

  const { data, error } = await supabase.rpc('create_order_secure', {
    _food_id: validation.data.food_id,
    _quantity: validation.data.quantity,
    _note: validation.data.note ?? null,
  })

  if (error) {
    const message = error.message || 'Khong the dat hang luc nay.'
    return NextResponse.json(
      { error: message },
      { status: mapOrderErrorToStatus(message), headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  return NextResponse.json(
    { success: true, order: data },
    { status: 200, headers: buildRateLimitHeaders(rateLimitResult) }
  )
}
