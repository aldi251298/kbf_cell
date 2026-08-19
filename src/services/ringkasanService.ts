/**
 * Ringkasan Service Layer
 *
 * Phase 2: implementation now fetches real data from the /api/ringkasan route
 * (which aggregates from Supabase). Signatures preserved.
 */

import type { RingkasanHarian } from "@/types";

/**
 * Get today's summary.
 */
export async function getRingkasanHariIni(): Promise<RingkasanHarian> {
  const today = new Date().toISOString().slice(0, 10);
  const res = await fetch(`/api/ringkasan?tanggal=${today}`);
  if (!res.ok) throw new Error("Gagal mengambil ringkasan hari ini.");
  return res.json();
}

/**
 * Get summary for specific date.
 * @param tanggal - Target date
 */
export async function getRingkasanByTanggal(
  tanggal: Date,
): Promise<RingkasanHarian> {
  const dateStr = tanggal.toISOString().slice(0, 10);
  const res = await fetch(`/api/ringkasan?tanggal=${dateStr}`);
  if (!res.ok) throw new Error("Gagal mengambil ringkasan.");
  return res.json();
}

/**
 * Get summary for date range.
 * @param hariKembali - Number of days to look back
 */
export async function getRingkasanPeriodeService(
  hariKembali: number = 30,
): Promise<RingkasanHarian[]> {
  const res = await fetch(`/api/ringkasan?hariKembali=${hariKembali}`);
  if (!res.ok) throw new Error("Gagal mengambil ringkasan periode.");
  return res.json();
}

/**
 * Get summary comparison (today vs yesterday).
 */
export async function getPerbandinganRingkasan(): Promise<{
  today: RingkasanHarian;
  yesterday: RingkasanHarian;
  perubahan: {
    omzet: number;
    transaksi: number;
  };
}> {
  const res = await fetch(`/api/ringkasan?perbandingan=true`);
  if (!res.ok) throw new Error("Gagal mengambil perbandingan ringkasan.");
  return res.json();
}
