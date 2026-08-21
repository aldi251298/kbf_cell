/**
 * Ringkasan Service Layer
 *
 * Phase 2: implementation now fetches real data from the /api/ringkasan route
 * (which aggregates from Supabase). Signatures preserved.
 */

import type { RingkasanHarian } from "@/types";

/**
 * Get WIB date string (YYYY-MM-DD) for today.
 * This avoids the UTC date extraction bug when converting to ISO string.
 */
function getTodayWIBDateString(): string {
  const now = new Date();
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

  // Convert to WIB timezone
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const wibMs = utcMs + WIB_OFFSET_MS;
  const wibDate = new Date(wibMs);

  // Return WIB date as YYYY-MM-DD string
  const year = wibDate.getUTCFullYear();
  const month = String(wibDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(wibDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get today's summary (WIB timezone).
 */
export async function getRingkasanHariIni(): Promise<RingkasanHarian> {
  const dateStr = getTodayWIBDateString();
  const res = await fetch(`/api/ringkasan?tanggal=${dateStr}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Gagal mengambil ringkasan hari ini.");
  return res.json();
}

/**
 * Get summary for specific date.
 * @param tanggal - Target date (assumed to be in WIB/local timezone)
 */
export async function getRingkasanByTanggal(
  tanggal: Date,
): Promise<RingkasanHarian> {
  // Use WIB date components to avoid UTC date extraction bug
  const year = tanggal.getUTCFullYear();
  const month = String(tanggal.getUTCMonth() + 1).padStart(2, "0");
  const day = String(tanggal.getUTCDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;
  const res = await fetch(`/api/ringkasan?tanggal=${dateStr}`, {
    cache: "no-store",
  });
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
  const res = await fetch(`/api/ringkasan?hariKembali=${hariKembali}`, {
    cache: "no-store",
  });
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
  const res = await fetch(`/api/ringkasan?perbandingan=true`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Gagal mengambil perbandingan ringkasan.");
  return res.json();
}
