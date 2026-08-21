/**
 * Ringkasan Service Layer
 *
 * Phase 2: implementation now fetches real data from the /api/ringkasan route
 * (which aggregates from Supabase). Signatures preserved.
 */

import type { RingkasanHarian } from "@/types";

/**
 * WIB = UTC+7 — helper to get start of today in WIB, expressed as UTC timestamp
 * This ensures "today" matches Indonesia local date, not UTC date.
 */
function getTodayStartWIB(): Date {
  const now = new Date();
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

  // Convert to WIB timezone
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const wibMs = utcMs + WIB_OFFSET_MS;
  const wibDate = new Date(wibMs);

  // Get start of day in WIB (00:00:00 WIB)
  const startOfDayWIB = new Date(
    Date.UTC(
      wibDate.getUTCFullYear(),
      wibDate.getUTCMonth(),
      wibDate.getUTCDate(),
    ),
  );

  // Convert back to UTC timestamp
  return new Date(startOfDayWIB.getTime() - WIB_OFFSET_MS);
}

/**
 * Get today's summary (WIB timezone).
 */
export async function getRingkasanHariIni(): Promise<RingkasanHarian> {
  const todayStart = getTodayStartWIB();
  const dateStr = todayStart.toISOString().slice(0, 10);
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
  const dateStr = tanggal.toISOString().slice(0, 10);
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
