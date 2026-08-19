import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * POST /api/seed
 *
 * Idempotent seed for 3 konter + 3 perangkat.
 * DEV ONLY — protected by INGEST_API_SECRET.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-api-key");
  if (secret !== process.env.INGEST_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  // Insert perangkat first, then konter.
  // Uses onConflict do nothing so it is safe to re-run.
  const { error: perangkatErr } = await supabase
    .from("perangkat")
    .upsert(
      [
        { id: "DEV-001", nama: "Maju Jaya - Jakarta", konter_id: "KONTER-001", lokasi: "Jakarta Selatan" },
        { id: "DEV-002", nama: "Berkah Mandiri - Tangerang", konter_id: "KONTER-002", lokasi: "Tangerang" },
        { id: "DEV-003", nama: "Sumber Rejeki - Bekasi", konter_id: "KONTER-003", lokasi: "Bekasi" },
      ],
      { onConflict: "id" },
    );

  if (perangkatErr) {
    console.error("[seed] perangkat error:", perangkatErr.message);
    return NextResponse.json({ error: perangkatErr.message }, { status: 500 });
  }

  const { error: konterErr } = await supabase
    .from("konter")
    .upsert(
      [
        { id: "KONTER-001", nama: "KBF Cell Pasar Baru", lokasi: "Jakarta Pusat", perangkat_id: "DEV-001" },
        { id: "KONTER-002", nama: "KBF Cell Jawi Jawi", lokasi: "Jawi Jawi", perangkat_id: "DEV-002" },
        { id: "KONTER-003", nama: "KBF Cell Cupak", lokasi: "Cupak", perangkat_id: "DEV-003" },
      ],
      { onConflict: "id" },
    );

  if (konterErr) {
    console.error("[seed] konter error:", konterErr.message);
    return NextResponse.json({ error: konterErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Seed data inserted (idempotent)." });
}