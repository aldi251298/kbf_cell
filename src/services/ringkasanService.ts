/**
 * Ringkasan Service Layer
 *
 * Phase 2: implementation now fetches real data from the /api/ringkasan route
 * (which aggregates from Supabase). Signatures preserved.
 */

import type { RingkasanHarian } from "@/types";
import { getRentangWaktuWIB } from "@/lib/utils";

/**
 * Extended RingkasanHarian with Alpines balance fields
 */
export interface RingkasanHarianWithSaldo extends RingkasanHarian {
  saldoAlpinesTerkini: number | null;
  waktuSaldoAlpinesTerkini: string | null;
}

/**
 * Get WIB date string (YYYY-MM-DD) for today.
 * This avoids the UTC date extraction bug when converting to ISO string.
 */
function getTodayWIBDateString(): string {
  const now = new Date();
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

  // now.getTime() returns UTC milliseconds. Add WIB offset (UTC+7) directly.
  // Do NOT use getTimezoneOffset() - it causes double-conversion if server isn't UTC.
  const wibMs = now.getTime() + WIB_OFFSET_MS;
  const wibDate = new Date(wibMs);

  // Return WIB date as YYYY-MM-DD string
  const year = wibDate.getUTCFullYear();
  const month = String(wibDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(wibDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get today's summary (WIB timezone).
 * Uses centralized getRentangWaktuWIB utility for correct date range handling.
 */
export async function getRingkasanHariIni(): Promise<RingkasanHarianWithSaldo> {
  const todayWIB = getTodayWIBDateString();
  const { awalUTC, akhirUTC } = getRentangWaktuWIB(todayWIB, todayWIB);

  const params = new URLSearchParams();
  params.set("startDate", awalUTC.toISOString());
  params.set("endDate", akhirUTC.toISOString());

  const res = await fetch(`/api/ringkasan?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Gagal mengambil ringkasan hari ini.");
  return res.json();
}

/**
 * Get summary for specific date.
 * Uses centralized getRentangWaktuWIB utility for correct date range handling.
 * @param tanggal - Target date (assumed to be in WIB/local timezone)
 */
export async function getRingkasanByTanggal(
  tanggal: Date,
): Promise<RingkasanHarianWithSaldo> {
  // Use WIB date components to avoid UTC date extraction bug
  const year = tanggal.getUTCFullYear();
  const month = String(tanggal.getUTCMonth() + 1).padStart(2, "0");
  const day = String(tanggal.getUTCDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  const { awalUTC, akhirUTC } = getRentangWaktuWIB(dateStr, dateStr);

  const params = new URLSearchParams();
  params.set("startDate", awalUTC.toISOString());
  params.set("endDate", akhirUTC.toISOString());

  const res = await fetch(`/api/ringkasan?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Gagal mengambil ringkasan.");
  return res.json();
}

/**
 * Get summary for date range.
 * Uses centralized getRentangWaktuWIB utility for correct date range handling.
 * @param tanggalMulai - Start date in YYYY-MM-DD format (WIB)
 * @param tanggalAkhir - End date in YYYY-MM-DD format (WIB)
 */
export async function getRingkasanByDateRange(
  tanggalMulai: string,
  tanggalAkhir: string,
): Promise<RingkasanHarian[]> {
  const { awalUTC, akhirUTC } = getRentangWaktuWIB(tanggalMulai, tanggalAkhir);

  const params = new URLSearchParams();
  params.set("startDate", awalUTC.toISOString());
  params.set("endDate", akhirUTC.toISOString());

  const res = await fetch(`/api/ringkasan?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Gagal mengambil ringkasan periode.");
  return res.json();
}

/**
 * Get summary for date range (legacy - uses hariKembali).
 * @param hariKembali - Number of days to look back
 * @deprecated Use getRingkasanByDateRange instead
 */
export async function getRingkasanPeriodeService(
  hariKembali: number = 30,
): Promise<RingkasanHarian[]> {
  const endWIB = getTodayWIBDateString();
  const endDate = new Date(endWIB + "T00:00:00");
  endDate.setDate(endDate.getDate() - 1); // yesterday
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - hariKembali + 1);

  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  return getRingkasanByDateRange(startStr, endStr);
}

/**
 * Get summary comparison (today vs yesterday).
 * Uses centralized getRentangWaktuWIB utility for correct date range handling.
 */
export async function getPerbandinganRingkasan(): Promise<{
  today: RingkasanHarianWithSaldo;
  yesterday: RingkasanHarianWithSaldo;
  perubahan: {
    omzet: number;
    transaksi: number;
  };
}> {
  const todayWIB = getTodayWIBDateString();
  const yesterday = new Date(todayWIB + "T00:00:00");
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayWIB = yesterday.toISOString().split("T")[0];

  const [todayData, yesterdayData] = await Promise.all([
    getRingkasanByTanggal(new Date(todayWIB + "T00:00:00")),
    getRingkasanByTanggal(new Date(yesterdayWIB + "T00:00:00")),
  ]);

  return {
    today: todayData,
    yesterday: yesterdayData,
    perubahan: {
      omzet: todayData.totalOmzet - yesterdayData.totalOmzet,
      transaksi: todayData.totalTransaksi - yesterdayData.totalTransaksi,
    },
  };
}
