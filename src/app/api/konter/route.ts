import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { mapKonter } from "@/lib/mappers";
import type { KonterRow } from "@/types/database";

/**
 * GET /api/konter
 *
 * Returns all counter locations. Authenticated via Supabase Auth session (RLS).
 */
export async function GET() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("konter").select("*").order("id");

  if (error) {
    console.error("[api/konter] query error:", error.message);
    return NextResponse.json(
      { error: "Gagal mengambil data konter." },
      { status: 500 },
    );
  }

  const rows = (data ?? []) as unknown as KonterRow[];
  return NextResponse.json(rows.map(mapKonter));
}
