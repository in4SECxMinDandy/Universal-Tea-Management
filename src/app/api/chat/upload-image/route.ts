import { NextResponse } from 'next/server'

import { buildRateLimitHeaders, rateLimit } from '@/lib/middleware/rateLimit'
import { createClient } from '@/lib/supabase/server'
import {
  getExtensionForMimeType,
  validateImageFile,
} from '@/lib/validation/fileValidation'
import { imageUploadSchema } from '@/lib/validation/schemas'

const uploadLimiter = rateLimit({
  windowMs: 60_000,
  maxRequests: 5,
  keyPrefix: 'chat-upload',
})

export async function POST(request: Request) {
  const rateLimitResult = await uploadLimiter(request)

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Ban da tai anh qua nhieu lan. Vui long thu lai sau.' },
      { status: 429, headers: buildRateLimitHeaders(rateLimitResult) }
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

  const formData = await request.formData()
  const file = formData.get('file')
  const session_id = formData.get('session_id')

  const validation = imageUploadSchema.safeParse({
    file,
    session_id,
  })

  if (!validation.success) {
    return NextResponse.json(
      {
        error: validation.error.issues[0]?.message ?? 'Du lieu tai len khong hop le.',
        details: validation.error.flatten(),
      },
      { status: 400, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  const imageValidation = await validateImageFile(validation.data.file)

  if (!imageValidation.valid) {
    return NextResponse.json(
      { error: imageValidation.error },
      { status: 400, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  const { data: chatSession, error: chatSessionError } = await supabase
    .from('chat_sessions')
    .select('id, user_id, status')
    .eq('id', validation.data.session_id)
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
      { error: 'Ban khong co quyen tai anh cho phien chat nay.' },
      { status: 403, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  const extension = getExtensionForMimeType(imageValidation.detectedMimeType)
  const filePath = `${session.user.id}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage.from('chat-images').upload(
    filePath,
    validation.data.file,
    {
      cacheControl: '3600',
      contentType: imageValidation.detectedMimeType,
      upsert: false,
    }
  )

  if (uploadError) {
    console.error('[API] image upload failed', uploadError)

    return NextResponse.json(
      { error: 'Khong the tai anh luc nay.' },
      { status: 500, headers: buildRateLimitHeaders(rateLimitResult) }
    )
  }

  const { data: urlData } = supabase.storage.from('chat-images').getPublicUrl(filePath)

  return NextResponse.json(
    { success: true, url: urlData.publicUrl },
    { status: 200, headers: buildRateLimitHeaders(rateLimitResult) }
  )
}
