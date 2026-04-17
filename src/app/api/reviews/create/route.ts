import { NextResponse } from 'next/server'

import { buildRateLimitHeaders, rateLimit } from '@/lib/middleware/rateLimit'
import { createClient } from '@/lib/supabase/server'
import { FOOD_REVIEW_SELECT_FIELDS } from '@/lib/supabase/selects'
import { reviewCreateSchema } from '@/lib/validation/schemas'

const reviewCreateLimiter = rateLimit({
  windowMs: 60_000,
  maxRequests: 5,
  keyPrefix: 'reviews-create',
})

function mapReviewCreateError(message: string) {
  if (message === 'Unauthorized') return 401
  if (message === 'Admins cannot review orders') return 403
  if (message === 'Order not found') return 404
  if (message === 'Forbidden') return 403
  if (message === 'Order not completed') return 409
  if (message === 'Review already exists') return 409
  return 500
}

export async function POST(request: Request) {
  const rateLimitResult = await reviewCreateLimiter(request)

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Ban da gui qua nhieu danh gia. Vui long thu lai sau.' },
      { status: 429, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Du lieu danh gia khong hop le.' },
      { status: 400, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  const validation = reviewCreateSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      {
        error: validation.error.issues[0]?.message ?? 'Thong tin danh gia khong hop le.',
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

  const { data: isAdmin } = await supabase.rpc('has_role', {
    uid: session.user.id,
    role_name: 'STORE_ADMIN',
  })

  if (isAdmin) {
    return NextResponse.json(
      { error: 'Admins cannot review orders' },
      { status: 403, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  const { order_id, rating, comment } = validation.data

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, user_id, food_id, status')
    .eq('id', order_id)
    .single()

  if (orderError || !order) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  if (order.user_id !== session.user.id) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  if (order.status !== 'completed') {
    return NextResponse.json(
      { error: 'Order not completed' },
      { status: 409, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  const { data: existingReviews } = await supabase
    .from('food_reviews')
    .select('id')
    .eq('order_id', order_id)
    .limit(1)

  if ((existingReviews ?? []).length > 0) {
    return NextResponse.json(
      { error: 'Review already exists' },
      { status: 409, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  const reviewerName =
    session.user.user_metadata?.full_name ||
    session.user.user_metadata?.name ||
    session.user.email ||
    'Khach hang'

  const { data: review, error: insertError } = await supabase
    .from('food_reviews')
    .insert({
      order_id: order.id,
      food_id: order.food_id,
      user_id: session.user.id,
      reviewer_name: reviewerName,
      rating,
      comment: comment ?? null,
    })
    .select(FOOD_REVIEW_SELECT_FIELDS)
    .single()

  if (insertError || !review) {
    const message = insertError?.message || 'Khong the luu danh gia luc nay.'
    return NextResponse.json(
      { error: message },
      { status: mapReviewCreateError(message), headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  return NextResponse.json(
    { success: true, review },
    { status: 200, headers: buildRateLimitHeaders(rateLimitResult) }
  )
}
