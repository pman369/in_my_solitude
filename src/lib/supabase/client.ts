// Browser-side Supabase client (for Client Components)
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // We check if these exist before creating the client to avoid crashing during static generation
  // where these might be missing if not configured in the build environment.
  if (!url || !anonKey) {
    // If they are missing, we return a client with empty strings or placeholders 
    // to allow the build to proceed. 
    return createBrowserClient<Database>(
      url || "https://placeholder-url.supabase.co",
      anonKey || "placeholder-key"
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
