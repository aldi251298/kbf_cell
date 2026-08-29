import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // CEK PALING AWAL: Android endpoints (ingest & health) — TIDAK PERLU AUTH
  // Return early SEBELUM bikin Supabase client & panggil getUser()
  const isApiIngest =
    req.nextUrl.pathname.startsWith("/api/ingest") ||
    req.nextUrl.pathname.startsWith("/api/health");

  if (isApiIngest) return res;

  // API routes (other than ingest/health) should return 401 JSON, not redirect
  // This allows client-side apiFetch()/isSessionExpired() to detect auth expiry properly
  const isApiRoute = req.nextUrl.pathname.startsWith("/api/");

  const isLoginPage = req.nextUrl.pathname === "/login";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Use getUser() instead of getSession() for proper validation
  // getUser() validates the JWT and triggers token refresh if needed
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isLoginPage) {
    // For API routes: return 401 JSON so client can handle it (refresh token, show expired UI, etc.)
    if (isApiRoute) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Session expired" },
        { status: 401 },
      );
    }
    // For page routes: redirect to login
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|kbf_logo.png|kbf_group.png|logo_kbf.png).*)",
  ],
};
