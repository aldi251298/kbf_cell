/**
 * Laporan Analytics Service (Fase 2.9)
 *
 * New service for the redesigned analytics dashboard with charts and deep analysis.
 * All functions are pure SELECT queries - no schema changes, no data mutations.
 */

import { createServiceRoleClient } from "@/lib/supabase/server";
import type { TransaksiRow } from "@/types/database";
import type {
  FilterLaporan,
  RingkasanLaporan,
  TrenHarianData,
  BreakdownJenisTransaksi,
  PerbandinganKonter,
  TopProduk,
  DistribusiJam,
  LaporanAnalyticsData,
  TransaksiExportRow,
} from "@/types/laporanAnalytics";
import {
  getKategoriLabel,
  getRentangWaktuWIB,
  getTodayWIBDateString,
} from "@/lib/utils";

/**
 * Calculate date range based on filter
 */
function hitungRentangFilter(filter: FilterLaporan): {
  awalUTC: Date;
  akhirUTC: Date;
} {
  const todayWIB = getTodayWIBDateString();

  if (
    filter.periode === "custom" &&
    filter.tanggalMulai &&
    filter.tanggalSelesai
  ) {
    const mulai = filter.tanggalMulai.toISOString().split("T")[0];
    const selesai = filter.tanggalSelesai.toISOString().split("T")[0];
    return getRentangWaktuWIB(mulai, selesai);
  }

  let tanggalMulai: string;
  let tanggalSelesai: string;

  switch (filter.periode) {
    case "hari_ini":
      tanggalMulai = todayWIB;
      tanggalSelesai = todayWIB;
      break;
    case "7_hari": {
      // Parse todayWIB (YYYY-MM-DD) and subtract 6 days in WIB timezone
      const [year, month, day] = todayWIB.split("-").map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      date.setUTCDate(date.getUTCDate() - 6);
      tanggalMulai = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
      tanggalSelesai = todayWIB;
      break;
    }
    case "30_hari": {
      // Parse todayWIB (YYYY-MM-DD) and subtract 29 days in WIB timezone
      const [year, month, day] = todayWIB.split("-").map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      date.setUTCDate(date.getUTCDate() - 29);
      tanggalMulai = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
      tanggalSelesai = todayWIB;
      break;
    }
    case "bulan_ini": {
      const [year, month] = todayWIB.split("-").map(Number);
      tanggalMulai = `${year}-${String(month).padStart(2, "0")}-01`;
      tanggalSelesai = todayWIB;
      break;
    }
    default:
      tanggalMulai = todayWIB;
      tanggalSelesai = todayWIB;
  }

  return getRentangWaktuWIB(tanggalMulai, tanggalSelesai);
}

/**
 * Build base query with filters applied
 * Returns the query builder and a konterMap for name resolution
 */
async function buildBaseQuery(filter: FilterLaporan) {
  const supabase = createServiceRoleClient();
  const { awalUTC, akhirUTC } = hitungRentangFilter(filter);

  // Fetch konter list for name resolution (manual LEFT JOIN equivalent)
  let konterMap = new Map<string, string>();
  try {
    const { data: konterRows } = await supabase
      .from("konter")
      .select("id, nama")
      .order("id");
    konterMap = new Map(
      (konterRows ?? []).map((k) => [k.id, k.nama] as [string, string]),
    );
  } catch {
    // If konter fetch fails, continue with empty map
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from("transaksi")
    .select(
      "nominal, detail_tambahan, jenis_transaksi, status, provider, waktu, konter_id, nama_produk, nomor_tujuan",
    )
    .eq("status", "sukses")
    .gte("waktu", awalUTC.toISOString())
    .lte("waktu", akhirUTC.toISOString());

  if (filter.konterId !== "semua") {
    query = query.eq("konter_id", filter.konterId);
  }
  if (filter.provider !== "semua") {
    query = query.eq("provider", filter.provider);
  }

  return { query, konterMap };
}

/**
 * Get summary cards data (Ringkasan Laporan)
 */
export async function ambilRingkasanLaporan(
  filter: FilterLaporan,
): Promise<RingkasanLaporan> {
  const { query, konterMap } = await buildBaseQuery(filter);
  const { data } = await query;
  const rows = (data ?? []) as unknown as TransaksiRow[];

  // Add konter name to each row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rowsWithKonter = rows.map((r: any) => ({
    ...r,
    konter_nama:
      konterMap.get(r.konter_id ?? "") ?? r.konter_id ?? "Tidak diketahui",
  }));

  const totalOmzet = rowsWithKonter.reduce((t, r) => t + (r.nominal ?? 0), 0);
  const totalPendapatanBersih = rowsWithKonter.reduce(
    (t, r) =>
      t +
      (r.detail_tambahan?.admin_konter
        ? Number(r.detail_tambahan.admin_konter)
        : 0),
    0,
  );
  const totalTransaksi = rowsWithKonter.length;
  const rataRataPerTransaksi =
    totalTransaksi > 0 ? Math.round(totalOmzet / totalTransaksi) : 0;

  return {
    totalOmzet,
    totalPendapatanBersih,
    totalTransaksi,
    rataRataPerTransaksi,
  };
}

/**
 * Get daily trend data for line chart
 */
export async function ambilTrenHarian(
  filter: FilterLaporan,
): Promise<TrenHarianData[]> {
  const { query, konterMap } = await buildBaseQuery(filter);
  const { data } = await query;
  const rows = (data ?? []) as unknown as TransaksiRow[];

  // Add konter name to each row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rowsWithKonter = rows.map((r: any) => ({
    ...r,
    konter_nama:
      konterMap.get(r.konter_id ?? "") ?? r.konter_id ?? "Tidak diketahui",
  }));

  const grouped = new Map<
    string,
    { omzet: number; pendapatanBersih: number; jumlahTransaksi: number }
  >();

  for (const row of rowsWithKonter) {
    const tanggal = new Date(row.waktu).toISOString().slice(0, 10); // YYYY-MM-DD
    const existing = grouped.get(tanggal) ?? {
      omzet: 0,
      pendapatanBersih: 0,
      jumlahTransaksi: 0,
    };
    existing.omzet += row.nominal ?? 0;
    existing.pendapatanBersih += row.detail_tambahan?.admin_konter
      ? Number(row.detail_tambahan.admin_konter)
      : 0;
    existing.jumlahTransaksi += 1;
    grouped.set(tanggal, existing);
  }

  return Array.from(grouped.entries())
    .map(([tanggal, v]) => ({ tanggal, ...v }))
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
}

/**
 * Get breakdown by transaction type (jenis_transaksi)
 */
export async function ambilBreakdownJenisTransaksi(
  filter: FilterLaporan,
): Promise<BreakdownJenisTransaksi[]> {
  const { query, konterMap } = await buildBaseQuery(filter);
  const { data } = await query;
  const rows = (data ?? []) as unknown as TransaksiRow[];

  // Add konter name to each row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rowsWithKonter = rows.map((r: any) => ({
    ...r,
    konter_nama:
      konterMap.get(r.konter_id ?? "") ?? r.konter_id ?? "Tidak diketahui",
  }));

  const grouped = new Map<
    string,
    { jumlahTransaksi: number; totalOmzet: number; totalAdmin: number }
  >();

  for (const row of rowsWithKonter) {
    const jenis = row.jenis_transaksi ?? "belum_dikenal";
    const existing = grouped.get(jenis) ?? {
      jumlahTransaksi: 0,
      totalOmzet: 0,
      totalAdmin: 0,
    };
    existing.jumlahTransaksi += 1;
    existing.totalOmzet += row.nominal ?? 0;
    existing.totalAdmin += row.detail_tambahan?.admin_konter
      ? Number(row.detail_tambahan.admin_konter)
      : 0;
    grouped.set(jenis, existing);
  }

  const totalOmzet = Array.from(grouped.values()).reduce(
    (s, v) => s + v.totalOmzet,
    0,
  );

  return Array.from(grouped.entries())
    .map(([jenis, v]) => ({
      jenis,
      label: getKategoriLabel(jenis),
      jumlahTransaksi: v.jumlahTransaksi,
      totalOmzet: v.totalOmzet,
      totalAdmin: v.totalAdmin,
      persentaseOmzet:
        totalOmzet > 0 ? Math.round((v.totalOmzet / totalOmzet) * 100) : 0,
    }))
    .sort((a, b) => b.totalOmzet - a.totalOmzet);
}

/**
 * Get counter comparison data (only when filter.konterId === "semua")
 */
export async function ambilPerbandinganKonter(
  filter: FilterLaporan,
): Promise<PerbandinganKonter[]> {
  if (filter.konterId !== "semua") {
    return [];
  }

  const { query, konterMap } = await buildBaseQuery(filter);
  const { data } = await query;
  const rows = (data ?? []) as unknown as TransaksiRow[];

  // Add konter name to each row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rowsWithKonter = rows.map((r: any) => ({
    ...r,
    konter_nama:
      konterMap.get(r.konter_id ?? "") ?? r.konter_id ?? "Tidak diketahui",
  }));

  const grouped = new Map<
    string,
    {
      namaKonter: string;
      totalOmzet: number;
      totalAdmin: number;
      jumlahTransaksi: number;
    }
  >();

  for (const row of rowsWithKonter) {
    const konterId = row.konter_id ?? "unknown";
    const namaKonter = row.konter_nama;
    const existing = grouped.get(konterId) ?? {
      namaKonter,
      totalOmzet: 0,
      totalAdmin: 0,
      jumlahTransaksi: 0,
    };
    existing.totalOmzet += row.nominal ?? 0;
    existing.totalAdmin += row.detail_tambahan?.admin_konter
      ? Number(row.detail_tambahan.admin_konter)
      : 0;
    existing.jumlahTransaksi += 1;
    grouped.set(konterId, existing);
  }

  const totalOmzet = Array.from(grouped.values()).reduce(
    (s, v) => s + v.totalOmzet,
    0,
  );

  return Array.from(grouped.entries())
    .map(([konterId, v]) => ({
      konterId,
      namaKonter: v.namaKonter,
      totalOmzet: v.totalOmzet,
      totalAdmin: v.totalAdmin,
      jumlahTransaksi: v.jumlahTransaksi,
      persentaseOmzet:
        totalOmzet > 0 ? Math.round((v.totalOmzet / totalOmzet) * 100) : 0,
    }))
    .sort((a, b) => b.totalOmzet - a.totalOmzet);
}

/**
 * Get top selling products
 */
export async function ambilTopProduk(
  filter: FilterLaporan,
  limit = 10,
): Promise<TopProduk[]> {
  const { query, konterMap } = await buildBaseQuery(filter);
  const { data } = await query;
  const rows = (data ?? []) as unknown as TransaksiRow[];

  // Add konter name to each row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rowsWithKonter = rows.map((r: any) => ({
    ...r,
    konter_nama:
      konterMap.get(r.konter_id ?? "") ?? r.konter_id ?? "Tidak diketahui",
  }));

  const grouped = new Map<
    string,
    { jumlahTerjual: number; totalOmzet: number }
  >();

  for (const row of rowsWithKonter) {
    if (!row.nama_produk) continue;
    const existing = grouped.get(row.nama_produk) ?? {
      jumlahTerjual: 0,
      totalOmzet: 0,
    };
    existing.jumlahTerjual += 1;
    existing.totalOmzet += row.nominal ?? 0;
    grouped.set(row.nama_produk, existing);
  }

  return Array.from(grouped.entries())
    .map(([namaProduk, v]) => ({ namaProduk, ...v }))
    .sort((a, b) => b.jumlahTerjual - a.jumlahTerjual)
    .slice(0, limit);
}

/**
 * Get hourly distribution (jam sibuk)
 */
export async function ambilDistribusiJam(
  filter: FilterLaporan,
): Promise<DistribusiJam[]> {
  const { query, konterMap } = await buildBaseQuery(filter);
  const { data } = await query;
  const rows = (data ?? []) as unknown as TransaksiRow[];

  // Add konter name to each row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rowsWithKonter = rows.map((r: any) => ({
    ...r,
    konter_nama:
      konterMap.get(r.konter_id ?? "") ?? r.konter_id ?? "Tidak diketahui",
  }));

  const grouped = new Map<number, number>();

  for (const row of rowsWithKonter) {
    const jam = new Date(row.waktu).getUTCHours(); // UTC hour
    // Convert to WIB hour (UTC+7)
    const jamWIB = (jam + 7) % 24;
    grouped.set(jamWIB, (grouped.get(jamWIB) ?? 0) + 1);
  }

  return Array.from({ length: 24 }, (_, i) => ({
    jam: i,
    jumlahTransaksi: grouped.get(i) ?? 0,
  }));
}

/**
 * Get all analytics data in one call (for initial page load)
 */
export async function ambilSemuaDataLaporan(
  filter: FilterLaporan,
): Promise<LaporanAnalyticsData> {
  const [
    ringkasan,
    trenHarian,
    breakdownJenis,
    perbandinganKonter,
    topProduk,
    distribusiJam,
  ] = await Promise.all([
    ambilRingkasanLaporan(filter),
    ambilTrenHarian(filter),
    ambilBreakdownJenisTransaksi(filter),
    ambilPerbandinganKonter(filter),
    ambilTopProduk(filter),
    ambilDistribusiJam(filter),
  ]);

  return {
    ringkasan,
    trenHarian,
    breakdownJenis,
    perbandinganKonter,
    topProduk,
    distribusiJam,
  };
}

/**
 * Get raw transactions for CSV export
 */
export async function ambilTransaksiUntukExport(
  filter: FilterLaporan,
): Promise<TransaksiExportRow[]> {
  const { query, konterMap } = await buildBaseQuery(filter);
  const { data } = await query;
  const rows = (data ?? []) as unknown as TransaksiRow[];

  // Add konter name to each row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rowsWithKonter = rows.map((r: any) => ({
    ...r,
    konter_nama:
      konterMap.get(r.konter_id ?? "") ?? r.konter_id ?? "Tidak diketahui",
  }));

  return rowsWithKonter.map((r) => ({
    waktu: formatWaktu(r.waktu),
    konter: r.konter_nama,
    jenis: getKategoriLabel(r.jenis_transaksi ?? "belum_dikenal"),
    produk: r.nama_produk ?? "-",
    nominal: r.nominal ?? 0,
    adminKonter: r.detail_tambahan?.admin_konter
      ? Number(r.detail_tambahan.admin_konter)
      : 0,
    status: r.status,
    tujuan: r.nomor_tujuan ?? "-",
  }));
}

/**
 * Format waktu for export (WIB timezone)
 */
function formatWaktu(waktu: string): string {
  const d = new Date(waktu);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(d);
}
