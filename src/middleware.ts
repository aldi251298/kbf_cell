import { NextResponse } from "next/server";

/**
 * Middleware: pass through all requests.
 * Auth has been removed — all routes are public.
 */
export async function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image, favicon
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
