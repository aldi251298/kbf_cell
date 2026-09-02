import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { RingkasanHarian } from "@/types";
import type { TransaksiRow, KonterRow } from "@/types/database";

/**
 * Ambil saldo Alpines terkini dari DUA sumber, bandingkan waktu, ambil yang paling baru.
 * SUMBER 1 (LAMA): saldo dari transaksi Alpines terakhir (pengurangan) - detail_tambahan.saldo_konter.sesudah
 * SUMBER 2 (BARU): saldo dari top-up WhatsApp terakhir - pengisian_saldo_alpines.saldo_sesudah
 */
async function ambilSaldoAlpinesTerkini(
  supabase: ReturnType<typeof createServiceRoleClient>,
  konterId?: string | null,
): Promise<{ saldo: number; waktuTerakhir: string } | null> {
  // SUMBER 1 (LAMA, TIDAK DIUBAH): saldo dari transaksi Alpines terakhir (pengurangan)
  let queryTransaksi = supabase
    .from("transaksi")
    .select("detail_tambahan, waktu")
    .eq("provider", "alpines")
    .not("detail_tambahan->saldo_konter", "is", null)
    .order("waktu", { ascending: false })
    .limit(1);

  if (konterId) {
    queryTransaksi = queryTransaksi.eq("konter_id", konterId);
  }

  const { data: dataTransaksi } = await queryTransaksi.maybeSingle();

  // SUMBER 2 (BARU): saldo dari top-up WhatsApp terakhir
  let queryTopUp = supabase
    .from("pengisian_saldo_alpines")
    .select("saldo_sesudah, waktu_capture")
    .order("waktu_capture", { ascending: false })
    .limit(1);

  if (konterId) {
    queryTopUp = queryTopUp.eq("konter_id", konterId);
  }

  const { data: dataTopUp } = await queryTopUp.maybeSingle();

  const kandidat: { saldo: number; waktuTerakhir: string }[] = [];

  if (
    dataTransaksi?.detail_tambahan?.saldo_konter?.sesudah != null &&
    dataTransaksi.waktu
  ) {
    kandidat.push({
      saldo: dataTransaksi.detail_tambahan.saldo_konter.sesudah,
      waktuTerakhir: dataTransaksi.waktu,
    });
  }
  if (dataTopUp?.saldo_sesudah != null && dataTopUp.waktu_capture) {
    kandidat.push({
      saldo: dataTopUp.saldo_sesudah,
      waktuTerakhir: dataTopUp.waktu_capture,
    });
  }

  if (kandidat.length === 0) return null;

  // Tambahan penting: validasi tanggal sebelum sort, cegah Invalid Date lolos lagi di masa depan
  const valid = kandidat.filter(
    (k) => !isNaN(new Date(k.waktuTerakhir).getTime()),
  );
  valid.sort(
    (a, b) =>
      new Date(b.waktuTerakhir).getTime() - new Date(a.waktuTerakhir).getTime(),
  );
  return valid[0] ?? null;
}

/**
 * GET /api/ringkasan?tanggal=YYYY-MM-DD&hariKembali=30&perbandingan=true&konterId=KONTER-001
 *
 * Computes daily summaries server-side from the transaksi table. Because the
 * data volume is small (3 devices), aggregation is done with a single query +
 * in-memory grouping rather than a materialized view.
 *
 * Modes:
 *   - tanggal=YYYY-MM-DD  -> single-day summary
 *   - hariKembali=N       -> N daily summaries (most recent first)
 *   - perbandingan=true   -> today + yesterday + delta
 *   - konterId=KONTER-001 -> filter by konter (for operator role)
 */

// Cache control headers to prevent stale data
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(req: NextRequest) {
  const supabase = createServiceRoleClient();
  const url = req.nextUrl;
  const tanggalParam = url.searchParams.get("tanggal");
  const startDateParam = url.searchParams.get("startDate");
  const endDateParam = url.searchParams.get("endDate");
  const hariKembali = Number(url.searchParams.get("hariKembali") ?? "0");
  const perbandingan = url.searchParams.get("perbandingan") === "true";
  const konterIdParam = url.searchParams.get("konterId");

  // Fetch konter list for name resolution
  const { data: konterRows } = await supabase
    .from("konter")
    .select("*")
    .order("id");
  const konters = (konterRows ?? []) as unknown as KonterRow[];
  const konterName = (id: string) =>
    konters.find((k) => k.id === id)?.nama ?? "Unknown";

  // Helper: compute a RingkasanHarian from a set of transaction rows for a day
  function buildSummary(
    dayStart: Date,
    rows: TransaksiRow[],
  ): RingkasanHarian & { pendapatanBersih: number } {
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

    // Fase 2.7: Calculate pendapatan bersih (sum of admin_konter from successful transactions)
    const pendapatanBersih = rows
      .filter((r) => r.status === "sukses")
      .reduce((sum, r) => {
        const adminKonter = r.detail_tambahan?.admin_konter ?? 0;
        return sum + Number(adminKonter);
      }, 0);

    return {
      tanggal: dayStart,
      totalOmzet,
      totalTransaksi,
      rataRataNilaiTransaksi,
      transaksiPerStatus,
      kontribusiPerKonter,
      pendapatanBersih,
    };
  }

  // WIB = UTC+7 — adjust query range so "today" matches Indonesia local date
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

  function startOfDayWIB(d: Date): Date {
    // Convert to WIB, get date parts, then convert back to UTC timestamp
    const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
    const wibMs = utcMs + WIB_OFFSET_MS;
    const wibDate = new Date(wibMs);
    const result = new Date(
      Date.UTC(
        wibDate.getUTCFullYear(),
        wibDate.getUTCMonth(),
        wibDate.getUTCDate(),
      ),
    );
    // Convert back from UTC to WIB boundary expressed as UTC timestamp
    return new Date(result.getTime() - WIB_OFFSET_MS);
  }

  // Helper to add konter filter to query
  // Generic: T represents any query builder type that has an .eq() method returning T
  function addKonterFilter<
    T extends { eq: (column: string, value: string) => T },
  >(query: T): T {
    if (konterIdParam) {
      return query.eq("konter_id", konterIdParam);
    }
    return query;
  }

  // --- Mode: perbandingan (today vs yesterday) ---
  if (perbandingan) {
    const now = new Date();
    const todayStart = startOfDayWIB(now);
    const yesterdayStart = startOfDayWIB(new Date(now.getTime() - 86400000));
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const yesterdayEnd = new Date(yesterdayStart.getTime() + 86400000);

    const [{ data: todayRows }, { data: yesterdayRows }, saldoData] =
      await Promise.all([
        addKonterFilter(
          supabase
            .from("transaksi")
            .select("*", { count: "exact" })
            .gte("waktu", todayStart.toISOString())
            .lt("waktu", todayEnd.toISOString()),
        ),
        addKonterFilter(
          supabase
            .from("transaksi")
            .select("*", { count: "exact" })
            .gte("waktu", yesterdayStart.toISOString())
            .lt("waktu", yesterdayEnd.toISOString()),
        ),
        ambilSaldoAlpinesTerkini(supabase, konterIdParam),
      ]);

    const today = buildSummary(
      todayStart,
      (todayRows ?? []) as unknown as TransaksiRow[],
    );
    const yesterday = buildSummary(
      yesterdayStart,
      (yesterdayRows ?? []) as unknown as TransaksiRow[],
    );

    return NextResponse.json(
      {
        today,
        yesterday,
        perubahan: {
          omzet: today.totalOmzet - yesterday.totalOmzet,
          transaksi: today.totalTransaksi - yesterday.totalTransaksi,
        },
        saldoAlpinesTerkini: saldoData?.saldo ?? null,
        waktuSaldoAlpinesTerkini: saldoData?.waktuTerakhir ?? null,
      },
      { headers: NO_STORE_HEADERS },
    );
  }

  // --- Mode: single tanggal or date range (startDate/endDate) ---
  if (tanggalParam || (startDateParam && endDateParam)) {
    let dayStart: Date;
    let dayEnd: Date;

    if (startDateParam && endDateParam) {
      // Use provided UTC boundaries directly
      dayStart = new Date(startDateParam);
      dayEnd = new Date(endDateParam);
    } else {
      // Single date mode
      dayStart = startOfDayWIB(new Date(tanggalParam!));
      dayEnd = new Date(dayStart.getTime() + 86400000);
    }

    const [{ data }, saldoData] = await Promise.all([
      addKonterFilter(
        supabase
          .from("transaksi")
          .select("*", { count: "exact" })
          .gte("waktu", dayStart.toISOString())
          .lt("waktu", dayEnd.toISOString()),
      ),
      ambilSaldoAlpinesTerkini(supabase, konterIdParam),
    ]);

    return NextResponse.json(
      {
        ...buildSummary(dayStart, (data ?? []) as unknown as TransaksiRow[]),
        saldoAlpinesTerkini: saldoData?.saldo ?? null,
        waktuSaldoAlpinesTerkini: saldoData?.waktuTerakhir ?? null,
      },
      { headers: NO_STORE_HEADERS },
    );
  }

  // --- Mode: periode (hariKembali) ---
  const days = Math.max(1, Math.min(365, hariKembali || 30));
  const now = new Date();
  const startDate = startOfDayWIB(
    new Date(now.getTime() - (days - 1) * 86400000),
  );
  const endDate = startOfDayWIB(new Date(now.getTime() + 86400000));

  const [{ data }, saldoData] = await Promise.all([
    addKonterFilter(
      supabase
        .from("transaksi")
        .select("*")
        .gte("waktu", startDate.toISOString())
        .lt("waktu", endDate.toISOString())
        .order("waktu", { ascending: true }),
    ),
    ambilSaldoAlpinesTerkini(supabase, konterIdParam),
  ]);

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
    const dayStart = startOfDayWIB(new Date(now.getTime() - i * 86400000));
    const key = dayStart.toISOString().slice(0, 10);
    const rows = byDay.get(key) ?? [];
    summaries.push(buildSummary(dayStart, rows));
  }

  // ascending by date
  summaries.sort((a, b) => a.tanggal.getTime() - b.tanggal.getTime());

  return NextResponse.json(
    {
      summaries,
      saldoAlpinesTerkini: saldoData?.saldo ?? null,
      waktuSaldoAlpinesTerkini: saldoData?.waktuTerakhir ?? null,
    },
    { headers: NO_STORE_HEADERS },
  );
}
