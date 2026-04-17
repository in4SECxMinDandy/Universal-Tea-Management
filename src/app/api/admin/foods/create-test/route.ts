import { NextResponse } from 'next/server'

import { buildRateLimitHeaders, rateLimit } from '@/lib/middleware/rateLimit'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createTestFoodLimiter = rateLimit({
  windowMs: 60_000,
  maxRequests: 20,
  keyPrefix: 'admin-foods-create-test',
})

const createTestFoodSchema = z.object({
  name: z.string().trim().min(1).max(255),
  price: z.number().min(1),
  stock_quantity: z.number().int().min(1),
  description: z.string().trim().max(1000).optional().nullable(),
})

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export async function POST(request: Request) {
  const rateLimitResult = await createTestFoodLimiter(request)

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

  const validation = createTestFoodSchema.safeParse(body)

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

  const { name, price, stock_quantity, description } = validation.data
  const slug = slugify(name)

  const { data, error } = await supabase
    .from('foods')
    .insert({
      name,
      slug,
      price,
      stock_quantity,
      description: description ?? null,
      is_available: true,
      is_featured: false,
      created_by: session.user.id,
    })
    .select('id, slug, name')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create food' },
      { status: 500, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  return NextResponse.json(
    { success: true, food: data },
    { status: 200, headers: buildRateLimitHeaders(rateLimitResult) }
  )
}
