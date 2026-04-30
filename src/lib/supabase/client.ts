// Browser-side Supabase client (for Client Components)
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // We check if these exist before creating the client to avoid crashing during static generation
  // where these might be missing if not configured in the build environment.
  if (!url || !anonKey) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

    if (isDevelopment && !isBuild) {
      throw new Error(
        "Supabase environment variables are missing. " +
        "Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local"
      );
    }

    // During build or in other environments, return a placeholder to avoid crashing 
    // static generation if these aren't provided in the build environment.
    return createBrowserClient<Database>(
      url || "https://placeholder-url.supabase.co",
      anonKey || "placeholder-key"
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
