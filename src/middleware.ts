import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return response; // Cannot check roles without URL/Key, so allow pass-through or handle safely
  }

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll()  { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — keeps tokens alive across tabs/refreshes
  const { data: { user } } = await supabase.auth.getUser()

  // ── Protect Admin Routes ───────────────────────────
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') || 
                       request.nextUrl.pathname.startsWith('/curator')

  if (isAdminRoute && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Protect /profile ─────────────────────────────────
  if (request.nextUrl.pathname.startsWith('/profile') && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/curator/:path*',
    '/profile/:path*',
    '/auth/callback',
  ],
}
