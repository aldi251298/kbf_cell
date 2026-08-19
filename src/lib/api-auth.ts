import { NextRequest, NextResponse } from "next/server";

/**
 * Verify the ingest API key from the `x-api-key` header.
 *
 * Used by the Android-facing endpoints (ingest transaksi, heartbeat) which are
 * NOT authenticated via Supabase Auth — they use a simple shared secret stored
 * in the INGEST_API_SECRET env var (server-only, never exposed to the browser).
 *
 * @returns null if valid, otherwise a 401 NextResponse to return immediately.
 */
export function verifyIngestApiKey(req: NextRequest): NextResponse | null {
  const apiKey = req.headers.get("x-api-key");
  const expected = process.env.INGEST_API_SECRET;

  if (!expected) {
    // Server misconfiguration — fail closed.
    return NextResponse.json(
      { error: "Server tidak terkonfigurasi untuk menerima ingest." },
      { status: 503 },
    );
  }

  if (!apiKey || apiKey !== expected) {
    return NextResponse.json(
      { error: "API key tidak valid." },
      { status: 401 },
    );
  }

  return null;
}