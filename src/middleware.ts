import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isLoginPage = req.nextUrl.pathname === "/login";
  const isApiIngest =
    req.nextUrl.pathname.startsWith("/api/ingest") ||
    req.nextUrl.pathname.startsWith("/api/health");

  // JANGAN proteksi endpoint ingest — itu dipanggil Android app tanpa sesi login sama sekali
  if (isApiIngest) return res;

  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|kbf_logo.png|kbf_group.png|logo_kbf.png).*)",
  ],
};
