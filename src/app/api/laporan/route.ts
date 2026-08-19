import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { LaporanPeriode, ModeLaporan } from "@/types";
import type { TransaksiRow, KonterRow } from "@/types/database";

/**
 * GET /api/laporan?mode=harian&periode=2025-01
 * GET /api/laporan?mode=bulanan&periode=2025
 * GET /api/laporan?mode=tahunan
 * GET /api/laporan?perbandingan=true&mode=harian&periode=2025-01
 *
 * Computes period reports server-side. Data volume is small (3 devices) so
 * aggregation is done in-memory after a single bounded query.
 */
export async function GET(req: NextRequest) {
  const supabase = createServiceRoleClient();
  const url = req.nextUrl;
  const mode = (url.searchParams.get("mode") ?? "harian") as ModeLaporan;
  const periode = url.searchParams.get("periode") ?? "";
  const perbandingan = url.searchParams.get("perbandingan") === "true";

  // Fetch konter list
  const { data: konterRows } = await supabase
    .from("konter")
    .select("*")
    .order("id");
  const konters = (konterRows ?? []) as unknown as KonterRow[];

  // WIB = UTC+7 — use UTC consistently for date range queries
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

  function toWIBStart(date: Date): Date {
    const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
    const wibMs = utcMs + WIB_OFFSET_MS;
    const wibDate = new Date(wibMs);
    const result = new Date(
      Date.UTC(
        wibDate.getUTCFullYear(),
        wibDate.getUTCMonth(),
        wibDate.getUTCDate(),
      ),
    );
    return new Date(result.getTime() - WIB_OFFSET_MS);
  }

  // Determine date range based on mode (using UTC)
  let rangeStart: Date;
  let rangeEnd: Date;

  if (mode === "harian") {
    const [yearStr, monthStr] = periode.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    rangeStart = toWIBStart(new Date(year, month, 1));
    rangeEnd = toWIBStart(new Date(year, month + 1, 1));
  } else if (mode === "bulanan") {
    const year = parseInt(periode, 10);
    rangeStart = toWIBStart(new Date(year, 0, 1));
    rangeEnd = toWIBStart(new Date(year + 1, 0, 1));
  } else {
    // tahunan: last 5 years
    const now = new Date();
    rangeStart = toWIBStart(new Date(now.getFullYear() - 4, 0, 1));
    rangeEnd = toWIBStart(new Date(now.getFullYear() + 1, 0, 1));
  }

  const { data } = await supabase
    .from("transaksi")
    .select("*, konter(nama)", { count: "exact" })
    .gte("waktu", rangeStart.toISOString())
    .lt("waktu", rangeEnd.toISOString())
    .order("waktu", { ascending: true });

  const rows = (data ?? []) as unknown as TransaksiRow[];

  // --- Perbandingan konter ---
  if (perbandingan) {
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

    const totalOmzet = Array.from(konterMap.values()).reduce(
      (s, v) => s + v.omzet,
      0,
    );

    const result = konters.map((k) => {
      const d = konterMap.get(k.id) ?? { omzet: 0, jumlahTransaksi: 0 };
      return {
        konterId: k.id,
        konterNama: k.nama,
        omzet: d.omzet,
        jumlahTransaksi: d.jumlahTransaksi,
        persentase:
          totalOmzet > 0 ? Math.round((d.omzet / totalOmzet) * 100) : 0,
      };
    });

    return NextResponse.json(result);
  }

  // --- Laporan periode ---
  const laporan = buildLaporan(mode, periode, rows);
  return NextResponse.json(laporan);
}

function buildLaporan(
  mode: ModeLaporan,
  periode: string,
  rows: TransaksiRow[],
): LaporanPeriode {
  const data: LaporanPeriode["data"] = [];
  const agregat = {
    totalOmzet: 0,
    totalTransaksi: 0,
    rataRataOmzet: 0,
    hariAktif: 0,
    hariTidakTransaksi: 0,
  };

  if (mode === "harian") {
    const [yearStr, monthStr] = periode.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // group rows by day (using UTC to match stored timestamps)
    const byDay = new Map<number, TransaksiRow[]>();
    rows.forEach((r) => {
      const d = new Date(r.waktu);
      if (d.getUTCFullYear() === year && d.getUTCMonth() === month) {
        const day = d.getUTCDate();
        const arr = byDay.get(day) ?? [];
        arr.push(r);
        byDay.set(day, arr);
      }
    });

    for (let day = 1; day <= daysInMonth; day++) {
      const dayRows = byDay.get(day) ?? [];
      const omzet = dayRows.reduce((s, r) => s + Number(r.nominal), 0);
      const jumlahTransaksi = dayRows.length;
      const rataRataNilai =
        jumlahTransaksi > 0 ? Math.round(omzet / jumlahTransaksi) : 0;

      data.push({
        tanggal: new Date(Date.UTC(year, month, day)),
        omzet,
        jumlahTransaksi,
        rataRataNilai,
      });

      agregat.totalOmzet += omzet;
      agregat.totalTransaksi += jumlahTransaksi;
      if (jumlahTransaksi > 0) agregat.hariAktif++;
      else agregat.hariTidakTransaksi++;
    }
  } else if (mode === "bulanan") {
    const year = parseInt(periode, 10);

    const byMonth = new Map<number, TransaksiRow[]>();
    rows.forEach((r) => {
      const d = new Date(r.waktu);
      if (d.getUTCFullYear() === year) {
        const m = d.getUTCMonth();
        const arr = byMonth.get(m) ?? [];
        arr.push(r);
        byMonth.set(m, arr);
      }
    });

    for (let m = 0; m < 12; m++) {
      const monthRows = byMonth.get(m) ?? [];
      const omzet = monthRows.reduce((s, r) => s + Number(r.nominal), 0);
      const jumlahTransaksi = monthRows.length;
      const hariAktif = new Set(
        monthRows.map((r) => new Date(r.waktu).getUTCDate()),
      ).size;
      const rataRataNilai = hariAktif > 0 ? Math.round(omzet / hariAktif) : 0;

      data.push({ bulan: m + 1, omzet, jumlahTransaksi, rataRataNilai });

      agregat.totalOmzet += omzet;
      agregat.totalTransaksi += jumlahTransaksi;
      if (jumlahTransaksi > 0) agregat.hariAktif++;
    }
  } else {
    // tahunan
    const byYear = new Map<number, TransaksiRow[]>();
    rows.forEach((r) => {
      const y = new Date(r.waktu).getUTCFullYear();
      const arr = byYear.get(y) ?? [];
      arr.push(r);
      byYear.set(y, arr);
    });

    const years = Array.from(byYear.keys()).sort();
    for (const y of years) {
      const yearRows = byYear.get(y) ?? [];
      const omzet = yearRows.reduce((s, r) => s + Number(r.nominal), 0);
      const jumlahTransaksi = yearRows.length;
      const rataRataNilai =
        yearRows.length > 0 ? Math.round(omzet / yearRows.length) : 0;

      data.push({
        tanggal: new Date(y, 0, 1),
        omzet,
        jumlahTransaksi,
        rataRataNilai,
      });

      agregat.totalOmzet += omzet;
      agregat.totalTransaksi += jumlahTransaksi;
    }
  }

  agregat.rataRataOmzet =
    data.length > 0 ? Math.round(agregat.totalOmzet / data.length) : 0;

  return { mode, periode, data, agregat };
}
