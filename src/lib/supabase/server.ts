// Server-side Supabase client (for Server Components, Route Handlers, Middleware)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return createServerClient<Database>(
      "https://placeholder-url.supabase.co",
      "placeholder-key",
      {
        cookies: {
          getAll() { return [] },
          setAll() {}
        }
      }
    );
  }

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll()  { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll() called from a Server Component — safe to ignore
          }
        },
      },
    }
  )
}
