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
          cookiesToSet.forEach(({ name, value }) =>
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

  // Bỏ qua kiểm tra auth trên các request prefetch của Next.js
  if (request.headers.get('purpose') === 'prefetch' || request.headers.get('x-middleware-prefetch') === '1') {
    return supabaseResponse
  }

  // Cập nhật session an toàn thông qua getSession() để cookie được refresh
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // Bảo vệ /admin: redirect về adminlogin nếu chưa đăng nhập
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!session) {
      const loginUrl = new URL('/adminlogin', request.url)
      return NextResponse.redirect(loginUrl)
    }

    const { data: hasRole } = await supabase.rpc('has_role', {
      uid: session.user.id,
      role_name: 'STORE_ADMIN',
    })

    if (hasRole !== true) {
      const loginUrl = new URL('/adminlogin', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Bảo vệ /history và /chat: redirect về login nếu chưa đăng nhập
  if (pathname.startsWith('/history') || pathname.startsWith('/chat')) {
    if (!session) {
      const loginUrl = new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
