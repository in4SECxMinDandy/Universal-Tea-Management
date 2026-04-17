import { NextResponse } from 'next/server'

import { buildRateLimitHeaders, rateLimit } from '@/lib/middleware/rateLimit'
import { createClient } from '@/lib/supabase/server'
import { chatMessageSchema } from '@/lib/validation/schemas'

const sendLimiter = rateLimit({
  windowMs: 60_000,
  maxRequests: 20,
  keyPrefix: 'chat-send',
})

export async function POST(request: Request) {
  const rateLimitResult = await sendLimiter(request)

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Ban da gui qua nhieu tin nhan. Vui long thu lai sau.' },
      { status: 429, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Du lieu gui len khong hop le.' },
      { status: 400, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  const validation = chatMessageSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      {
        error: validation.error.issues[0]?.message ?? 'Tin nhan khong hop le.',
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

  const { session_id, content, image_url } = validation.data

  const { data: chatSession, error: chatSessionError } = await supabase
    .from('chat_sessions')
    .select('id, user_id, status')
    .eq('id', session_id)
    .single()

  if (chatSessionError || !chatSession) {
    return NextResponse.json(
      { error: 'Khong tim thay phien chat hop le.' },
      { status: 403, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  const { data: isAdmin } = await supabase.rpc('has_role', {
    uid: session.user.id,
    role_name: 'STORE_ADMIN',
  })

  if (chatSession.status !== 'open') {
    return NextResponse.json(
      { error: 'Phien chat da dong.' },
      { status: 403, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  if (!isAdmin && chatSession.user_id !== session.user.id) {
    return NextResponse.json(
      { error: 'Ban khong co quyen gui tin nhan cho phien chat nay.' },
      { status: 403, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  const { data: message, error: insertError } = await supabase
    .from('chat_messages')
    .insert({
      session_id,
      sender_id: session.user.id,
      sender_role: isAdmin ? 'STORE_ADMIN' : 'USER',
      content,
      image_url: image_url ?? null,
    })
    .select('id, sender_id, sender_role, content, image_url, created_at')
    .single()

  if (insertError || !message) {
    console.error('[API] chat send failed', insertError)

    return NextResponse.json(
      { error: 'Khong the gui tin nhan luc nay.' },
      { status: 500, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  return NextResponse.json(
    { success: true, message },
    { status: 200, headers: buildRateLimitHeaders(rateLimitResult) }
  )
}
