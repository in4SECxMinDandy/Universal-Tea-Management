import { NextResponse } from 'next/server'

import { buildRateLimitHeaders, rateLimit } from '@/lib/middleware/rateLimit'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validation/schemas'

const loginLimiter = rateLimit({
  windowMs: 60_000,
  maxRequests: 5,
  keyPrefix: 'auth-login',
})

export async function POST(request: Request) {
  const rateLimitResult = await loginLimiter(request)

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Ban da dang nhap sai qua nhieu lan. Vui long thu lai sau.' },
      { status: 429, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Du lieu dang nhap khong hop le.' },
      { status: 400, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  const validation = loginSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      {
        error: validation.error.issues[0]?.message ?? 'Thong tin dang nhap khong hop le.',
        details: validation.error.flatten(),
      },
      { status: 400, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  const requireAdmin = new URL(request.url).searchParams.get('admin') === '1'
  const supabase = await createClient()
  const { email, password, captchaToken } = validation.data

  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
    ...(captchaToken ? { options: { captchaToken } } : {}),
  })

  if (signInError || !data.user) {
    return NextResponse.json(
      {
        error: signInError?.message || 'Email hoac mat khau khong dung.',
      },
      { status: 401, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  let isAdmin = false

  if (requireAdmin) {
    const { data: hasRole, error: roleError } = await supabase.rpc('has_role', {
      uid: data.user.id,
      role_name: 'STORE_ADMIN',
    })

    if (roleError) {
      console.error('[API] admin role check failed', roleError)

      return NextResponse.json(
        { error: 'Khong the kiem tra quyen truy cap luc nay.' },
        { status: 500, headers: buildRateLimitHeaders(rateLimitResult) }
      )
    }

    isAdmin = hasRole === true

    if (!isAdmin) {
      await supabase.auth.signOut()

      return NextResponse.json(
        { error: 'Tai khoan nay khong co quyen quan tri vien.' },
        { status: 403, headers: buildRateLimitHeaders(rateLimitResult) }
      )
    }
  }

  return NextResponse.json(
    {
      success: true,
      user: data.user,
      isAdmin,
      session: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }
        : null,
    },
    { status: 200, headers: buildRateLimitHeaders(rateLimitResult) }
  )
}
