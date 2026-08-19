import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { mapPerangkat } from "@/lib/mappers";
import type { PerangkatRow } from "@/types/database";

/**
 * GET /api/perangkat
 *
 * Returns all devices with computed online/offline status. Authenticated via
 * Supabase Auth session (RLS).
 */
export async function GET() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("perangkat")
    .select("*")
    .order("id");

  if (error) {
    console.error("[api/perangkat] query error:", error.message);
    return NextResponse.json(
      { error: "Gagal mengambil data perangkat." },
      { status: 500 },
    );
  }

  const rows = (data ?? []) as unknown as PerangkatRow[];
  return NextResponse.json(rows.map(mapPerangkat));
}
