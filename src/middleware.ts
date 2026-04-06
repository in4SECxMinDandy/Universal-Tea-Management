import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

type CookieOptions = {
  name: string
  value: string
  options?: Record<string, unknown>
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieOptions[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Bỏ qua kiểm tra auth trên các request prefetch của Next.js (cải thiện tốc độ chuyển trang đáng kể)
  if (request.headers.get('purpose') === 'prefetch' || request.headers.get('x-middleware-prefetch') === '1') {
    return supabaseResponse
  }

  // Cập nhật session an toàn thông qua getSession() để cookie được refresh
  await supabase.auth.getSession()

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
