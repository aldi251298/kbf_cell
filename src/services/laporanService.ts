/**
 * Laporan Service Layer
 *
 * Phase 2: implementation now fetches real data from the /api/laporan route
 * (which aggregates from Supabase). Signatures preserved.
 */

import type { ModeLaporan, LaporanPeriode } from "@/types";

/**
 * Get period report (daily/monthly/yearly).
 * @param mode - Report mode
 * @param periode - Period identifier (YYYY-MM for harian, YYYY for bulanan/tahunan)
 */
export async function getLaporan(
  mode: ModeLaporan,
  periode: string,
): Promise<LaporanPeriode> {
  const res = await fetch(
    `/api/laporan?mode=${mode}&periode=${encodeURIComponent(periode)}`,
  );
  if (!res.ok) throw new Error("Gagal mengambil laporan.");
  return res.json();
}

/**
 * Get comparison data between counters.
 */
export async function getPerbandinganKonter(
  mode: ModeLaporan,
  periode: string,
): Promise<
  Array<{
    konterId: string;
    konterNama: string;
    omzet: number;
    jumlahTransaksi: number;
    persentase: number;
  }>
> {
  const res = await fetch(
    `/api/laporan?perbandingan=true&mode=${mode}&periode=${encodeURIComponent(periode)}`,
  );
  if (!res.ok) throw new Error("Gagal mengambil perbandingan konter.");
  return res.json();
}
