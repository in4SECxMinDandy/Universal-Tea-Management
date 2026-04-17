import { NextResponse } from 'next/server'

import { buildRateLimitHeaders, rateLimit } from '@/lib/middleware/rateLimit'
import { createClient } from '@/lib/supabase/server'
import { FOOD_REVIEW_SELECT_FIELDS } from '@/lib/supabase/selects'
import { reviewDeleteSchema } from '@/lib/validation/schemas'

const reviewDeleteLimiter = rateLimit({
  windowMs: 60_000,
  maxRequests: 20,
  keyPrefix: 'reviews-delete',
})

export async function DELETE(request: Request) {
  const rateLimitResult = await reviewDeleteLimiter(request)

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Ban da gui qua nhieu yeu cau xoa danh gia. Vui long thu lai sau.' },
      { status: 429, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Du lieu xoa danh gia khong hop le.' },
      { status: 400, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  const validation = reviewDeleteSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      {
        error: validation.error.issues[0]?.message ?? 'Thong tin xoa danh gia khong hop le.',
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

  const { review_id } = validation.data

  const { data: review, error: deleteError } = await supabase
    .from('food_reviews')
    .delete()
    .eq('id', review_id)
    .select(FOOD_REVIEW_SELECT_FIELDS)
    .single()

  if (deleteError || !review) {
    return NextResponse.json(
      { error: deleteError?.message || 'Khong the xoa danh gia luc nay.' },
      { status: deleteError?.code === 'PGRST116' ? 404 : 500, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  return NextResponse.json(
    { success: true, review },
    { status: 200, headers: buildRateLimitHeaders(rateLimitResult) }
  )
}
