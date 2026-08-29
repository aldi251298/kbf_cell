import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 *
 * Uses the public anon key (NEXT_PUBLIC_*) — safe to expose because all tables
 * are protected by Row Level Security. Used by the dashboard to read data.
 *
 * Configured with auto token refresh to handle session expiry gracefully.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        // Auto-refresh token before it expires (default: 300s before expiry)
        autoRefreshToken: true,
        // Persist session in localStorage
        persistSession: true,
        // Detect session changes in other tabs
        detectSessionInUrl: true,
      },
    },
  );
}
