import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/simulator/ingest
 *
 * Fase 2.2: Server-side proxy from web simulator to /api/ingest/transaksi.
 * No API key needed anymore — just forward the raw text payload.
 *
 * DEV ONLY — gated by middleware to development environment only.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Forward to the real ingest endpoint (no API key needed)
  const ingestRes = await fetch(
    new URL("/api/ingest/transaksi", req.url).toString(),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const data = await ingestRes.json();
  return NextResponse.json(data, { status: ingestRes.status });
}