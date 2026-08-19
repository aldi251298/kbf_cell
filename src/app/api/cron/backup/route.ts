import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * GET /api/cron/backup
 *
 * Weekly backup endpoint. Protected by the CRON_SECRET env var (sent in the
 * Authorization header as `Bearer <CRON_SECRET>`). Exports all transaksi rows
 * as JSON and logs the count. In production, configure a Vercel Cron Job to
 * hit this endpoint weekly.
 *
 * NOTE: On Supabase free tier there is no automatic backup. This endpoint
 * provides a scheduled export. For storage, wire it to an external destination
 * (e.g. Vercel Blob, S3, or email) — see docs/BACKUP.md.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET tidak terkonfigurasi." },
      { status: 503 },
    );
  }

  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  // Export transaksi (the critical data)
  const { data: transaksi, error: trxErr } = await supabase
    .from("transaksi")
    .select("*")
    .order("waktu", { ascending: true });

  if (trxErr) {
    console.error("[cron/backup] gagal export transaksi:", trxErr.message);
    return NextResponse.json(
      { error: "Gagal export transaksi." },
      { status: 500 },
    );
  }

  // Export perangkat & konter
  const { data: perangkat } = await supabase
    .from("perangkat")
    .select("*")
    .order("id");
  const { data: konter } = await supabase
    .from("konter")
    .select("*")
    .order("id");

  const backup = {
    exported_at: now,
    tables: {
      transaksi: transaksi ?? [],
      perangkat: perangkat ?? [],
      konter: konter ?? [],
    },
    counts: {
      transaksi: transaksi?.length ?? 0,
      perangkat: perangkat?.length ?? 0,
      konter: konter?.length ?? 0,
    },
  };

  console.log(
    `[cron/backup] export pada ${now}: transaksi=${backup.counts.transaksi} perangkat=${backup.counts.perangkat} konter=${backup.counts.konter}`,
  );

  // Return as downloadable JSON. In a real deployment, also push to external
  // storage (Vercel Blob / S3) — see docs/BACKUP.md.
  return new NextResponse(JSON.stringify(backup, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="backup-${now.slice(0, 10)}.json"`,
    },
  });
}
