import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client bound to the current request's cookies.
 *
 * Use this in Server Components / Server Actions / Route Handlers that act on
 * behalf of an authenticated dashboard user. It respects RLS policies because
 * it carries the user's auth session.
 */
export async function createServerClientFromCookies() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    },
  );
}

/**
 * Service-role Supabase client (bypasses RLS).
 *
 * SERVER-ONLY. Never import this into client code. Used by:
 *  - ingest & heartbeat endpoints (authenticated by INGEST_API_KEY, not a user)
 *  - cron backup job
 *  - any admin/seed operation that must run regardless of RLS.
 */
export function createServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // no-op: service-role client has no user session
        },
      },
    },
  );
}
