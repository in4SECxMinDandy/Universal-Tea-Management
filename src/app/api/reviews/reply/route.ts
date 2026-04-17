import { NextResponse } from 'next/server'

import { buildRateLimitHeaders, rateLimit } from '@/lib/middleware/rateLimit'
import { createClient } from '@/lib/supabase/server'
import { FOOD_REVIEW_SELECT_FIELDS } from '@/lib/supabase/selects'
import { reviewReplySchema } from '@/lib/validation/schemas'

const reviewReplyLimiter = rateLimit({
  windowMs: 60_000,
  maxRequests: 20,
  keyPrefix: 'reviews-reply',
})

export async function POST(request: Request) {
  const rateLimitResult = await reviewReplyLimiter(request)

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Ban da gui qua nhieu phan hoi. Vui long thu lai sau.' },
      { status: 429, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Du lieu phan hoi khong hop le.' },
      { status: 400, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  const validation = reviewReplySchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      {
        error: validation.error.issues[0]?.message ?? 'Thong tin phan hoi khong hop le.',
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

  const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
    uid: session.user.id,
    role_name: 'STORE_ADMIN',
  })

  if (roleError || !isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  const { review_id, reply } = validation.data

  const { data: review, error: updateError } = await supabase
    .from('food_reviews')
    .update({
      admin_reply: reply,
      admin_replied_at: new Date().toISOString(),
      admin_replied_by: session.user.id,
    })
    .eq('id', review_id)
    .select(FOOD_REVIEW_SELECT_FIELDS)
    .single()

  if (updateError || !review) {
    return NextResponse.json(
      { error: updateError?.message || 'Khong the luu phan hoi luc nay.' },
      { status: updateError?.code === 'PGRST116' ? 404 : 500, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  return NextResponse.json(
    { success: true, review },
    { status: 200, headers: buildRateLimitHeaders(rateLimitResult) }
  )
}
