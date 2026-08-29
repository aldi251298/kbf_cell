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
