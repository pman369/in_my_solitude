import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function safeRedirectPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/';
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeRedirectPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth error — redirect to login with error flag
  return NextResponse.redirect(`${origin}/auth/login?error=auth`)
}
