import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyIngestApiKey } from "@/lib/api-auth";
import { computeDeviceStatus } from "@/lib/constants";
import type { HeartbeatPayload } from "@/types/database";

/**
 * POST /api/ingest/heartbeat
 *
 * Lightweight endpoint called periodically by the Android app. Records the
 * device's last_heartbeat timestamp (from which online/offline status is
 * computed) and optionally updates ip/user_agent. Also logs a heartbeat row
 * when the computed status changes, so the uptime history stays accurate.
 */
export async function POST(req: NextRequest) {
  const authError = verifyIngestApiKey(req);
  if (authError) return authError;

  let body: HeartbeatPayload;
  try {
    body = (await req.json()) as HeartbeatPayload;
  } catch {
    return NextResponse.json(
      { error: "Body bukan JSON yang valid." },
      { status: 400 },
    );
  }

  if (!body.device_id || typeof body.device_id !== "string") {
    return NextResponse.json(
      { error: "device_id wajib diisi." },
      { status: 400 },
    );
  }

  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  // 1. Fetch current device state
  const { data: device, error: deviceErr } = await supabase
    .from("perangkat")
    .select("id, konter_id, last_heartbeat")
    .eq("id", body.device_id)
    .single();

  if (deviceErr || !device) {
    return NextResponse.json(
      { error: `device_id tidak dikenal: ${body.device_id}` },
      { status: 404 },
    );
  }

  // 2. Update last_heartbeat (+ optional ip/user_agent)
  const updateFields: Record<string, string> = { last_heartbeat: now };
  if (body.ip) updateFields.ip = body.ip;
  if (body.user_agent) updateFields.user_agent = body.user_agent;

  const { error: updateErr } = await supabase
    .from("perangkat")
    .update(updateFields)
    .eq("id", body.device_id);

  if (updateErr) {
    console.error("[heartbeat] gagal update:", updateErr.message);
    return NextResponse.json(
      { error: "Gagal memperbarui heartbeat." },
      { status: 500 },
    );
  }

  // 3. Log status change to device_heartbeat if status changed
  const prevStatus = device.last_heartbeat
    ? computeDeviceStatus(device.last_heartbeat)
    : "offline";
  const newStatus = computeDeviceStatus(now);

  if (prevStatus !== newStatus) {
    await supabase.from("device_heartbeat").insert({
      device_id: body.device_id,
      konter_id: device.konter_id,
      status: newStatus,
      recorded_at: now,
      duration_minutes: null,
    });
  }

  console.log(
    `[heartbeat] device=${body.device_id} status=${newStatus} at=${now}`,
  );

  return NextResponse.json({ ok: true, status: newStatus });
}
