import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { mapRiwayatStatus } from "@/lib/mappers";
import type { DeviceHeartbeatRow } from "@/types/database";

/**
 * GET /api/perangkat/[konterId]/history?days=7
 *
 * Returns the uptime status history for a device (joined by konter_id).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ konterId: string }> },
) {
  const supabase = createServiceRoleClient();
  const { konterId } = await params;
  const days = Math.max(
    1,
    Math.min(90, Number(req.nextUrl.searchParams.get("days") ?? "7")),
  );

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("device_heartbeat")
    .select("*")
    .eq("konter_id", konterId)
    .gte("recorded_at", since.toISOString())
    .order("recorded_at", { ascending: true });

  if (error) {
    console.error("[api/perangkat/history] query error:", error.message);
    return NextResponse.json(
      { error: "Gagal mengambil riwayat perangkat." },
      { status: 500 },
    );
  }

  const rows = (data ?? []) as unknown as DeviceHeartbeatRow[];
  return NextResponse.json(mapRiwayatStatus(konterId, rows));
}
