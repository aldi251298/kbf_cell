import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { RingkasanHarian } from "@/types";
import type { TransaksiRow, KonterRow } from "@/types/database";

/**
 * GET /api/ringkasan?tanggal=YYYY-MM-DD&hariKembali=30&perbandingan=true
 *
 * Computes daily summaries server-side from the transaksi table. Because the
 * data volume is small (3 devices), aggregation is done with a single query +
 * in-memory grouping rather than a materialized view.
 *
 * Modes:
 *   - tanggal=YYYY-MM-DD  -> single-day summary
 *   - hariKembali=N       -> N daily summaries (most recent first)
 *   - perbandingan=true   -> today + yesterday + delta
 */
export async function GET(req: NextRequest) {
  const supabase = createServiceRoleClient();
  const url = req.nextUrl;
  const tanggalParam = url.searchParams.get("tanggal");
  const hariKembali = Number(url.searchParams.get("hariKembali") ?? "0");
  const perbandingan = url.searchParams.get("perbandingan") === "true";

  // Fetch konter list for name resolution
  const { data: konterRows } = await supabase
    .from("konter")
    .select("*")
    .order("id");
  const konters = (konterRows ?? []) as unknown as KonterRow[];
  const konterName = (id: string) =>
    konters.find((k) => k.id === id)?.nama ?? "Unknown";

  // Helper: compute a RingkasanHarian from a set of transaction rows for a day
  function buildSummary(dayStart: Date, rows: TransaksiRow[]): RingkasanHarian {
    const totalOmzet = rows.reduce((s, r) => s + Number(r.nominal), 0);
    const totalTransaksi = rows.length;
    const rataRataNilaiTransaksi =
      totalTransaksi > 0 ? Math.round(totalOmzet / totalTransaksi) : 0;

    const transaksiPerStatus = {
      sukses: rows.filter((r) => r.status === "sukses").length,
      gagal: rows.filter((r) => r.status === "gagal").length,
      pending: rows.filter((r) => r.status === "pending").length,
    };

    const konterMap = new Map<
      string,
      { omzet: number; jumlahTransaksi: number }
    >();
    rows.forEach((r) => {
      if (!r.konter_id) return;
      const cur = konterMap.get(r.konter_id) ?? {
        omzet: 0,
        jumlahTransaksi: 0,
      };
      cur.omzet += Number(r.nominal);
      cur.jumlahTransaksi += 1;
      konterMap.set(r.konter_id, cur);
    });

    const kontribusiPerKonter = Array.from(konterMap.entries()).map(
      ([konterId, d]) => ({
        konterId,
        konterNama: konterName(konterId),
        omzet: d.omzet,
        jumlahTransaksi: d.jumlahTransaksi,
      }),
    );

    return {
      tanggal: dayStart,
      totalOmzet,
      totalTransaksi,
      rataRataNilaiTransaksi,
      transaksiPerStatus,
      kontribusiPerKonter,
    };
  }

  function startOfDayUTC(d: Date): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  // --- Mode: perbandingan (today vs yesterday) ---
  if (perbandingan) {
    const now = new Date();
    const todayStart = startOfDayUTC(now);
    const yesterdayStart = startOfDayUTC(new Date(now.getTime() - 86400000));
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const yesterdayEnd = new Date(yesterdayStart.getTime() + 86400000);

    const [{ data: todayRows }, { data: yesterdayRows }] = await Promise.all([
      supabase
        .from("transaksi")
        .select("*, konter(nama)", { count: "exact" })
        .gte("waktu", todayStart.toISOString())
        .lt("waktu", todayEnd.toISOString()),
      supabase
        .from("transaksi")
        .select("*, konter(nama)", { count: "exact" })
        .gte("waktu", yesterdayStart.toISOString())
        .lt("waktu", yesterdayEnd.toISOString()),
    ]);

    const today = buildSummary(
      todayStart,
      (todayRows ?? []) as unknown as TransaksiRow[],
    );
    const yesterday = buildSummary(
      yesterdayStart,
      (yesterdayRows ?? []) as unknown as TransaksiRow[],
    );

    return NextResponse.json({
      today,
      yesterday,
      perubahan: {
        omzet: today.totalOmzet - yesterday.totalOmzet,
        transaksi: today.totalTransaksi - yesterday.totalTransaksi,
      },
    });
  }

  // --- Mode: single tanggal ---
  if (tanggalParam) {
    const dayStart = startOfDayUTC(new Date(tanggalParam));
    const dayEnd = new Date(dayStart.getTime() + 86400000);

    const { data } = await supabase
      .from("transaksi")
      .select("*, konter(nama)", { count: "exact" })
      .gte("waktu", dayStart.toISOString())
      .lt("waktu", dayEnd.toISOString());

    return NextResponse.json(
      buildSummary(dayStart, (data ?? []) as unknown as TransaksiRow[]),
    );
  }

  // --- Mode: periode (hariKembali) ---
  const days = Math.max(1, Math.min(365, hariKembali || 30));
  const now = new Date();
  const startDate = startOfDayUTC(new Date(now.getTime() - (days - 1) * 86400000));
  const endDate = startOfDayUTC(new Date(now.getTime() + 86400000));

  const { data } = await supabase
    .from("transaksi")
    .select("*")
    .gte("waktu", startDate.toISOString())
    .lt("waktu", endDate.toISOString())
    .order("waktu", { ascending: true });

  const allRows = (data ?? []) as unknown as TransaksiRow[];

  // Group by day
  const byDay = new Map<string, TransaksiRow[]>();
  allRows.forEach((r) => {
    const key = new Date(r.waktu).toISOString().slice(0, 10);
    const arr = byDay.get(key) ?? [];
    arr.push(r);
    byDay.set(key, arr);
  });

  const summaries: RingkasanHarian[] = [];
  for (let i = 0; i < days; i++) {
    const dayStart = startOfDayUTC(new Date(now.getTime() - i * 86400000));
    const key = dayStart.toISOString().slice(0, 10);
    const rows = byDay.get(key) ?? [];
    summaries.push(buildSummary(dayStart, rows));
  }

  // ascending by date
  summaries.sort((a, b) => a.tanggal.getTime() - b.tanggal.getTime());

  return NextResponse.json(summaries);
}
