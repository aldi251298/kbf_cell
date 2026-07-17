/**
 * Ringkasan Service Layer
 *
 * TODO [BACKEND INTEGRATION]: Replace fake data calls with actual API endpoints:
 * - GET    /api/ringkasan/hari-ini   -> today's summary
 * - GET    /api/ringkasan/:tanggal   -> summary for specific date
 * - GET    /api/ringkasan/periode?start=...&end=... -> summary for date range
 *
 * Current implementation uses fake data generator from 'src/data/ringkasanData'
 */

import { getRingkasanHarian, getRingkasanPeriode } from "@/data/ringkasanData";
import type { RingkasanHarian } from "@/types";

/**
 * Get today's summary
 * @returns Promise<RingkasanHarian>
 */
export async function getRingkasanHariIni(): Promise<RingkasanHarian> {
  // TODO [BACKEND INTEGRATION]: Replace with:
  // const response = await fetch('/api/ringkasan/hari-ini');
  // return response.json();

  const now = new Date();
  return getRingkasanHarian(now);
}

/**
 * Get summary for specific date
 * @param tanggal - Target date
 * @returns Promise<RingkasanHarian>
 */
export async function getRingkasanByTanggal(
  tanggal: Date,
): Promise<RingkasanHarian> {
  // TODO [BACKEND INTEGRATION]: Replace with:
  // const dateStr = tanggal.toISOString().split('T')[0];
  // const response = await fetch(`/api/ringkasan/${dateStr}`);
  // return response.json();

  return getRingkasanHarian(tanggal);
}

/**
 * Get summary for date range
 * @param hariKembali - Number of days to look back
 * @returns Promise<RingkasanHarian[]>
 */
export async function getRingkasanPeriodeService(
  hariKembali: number = 30,
): Promise<RingkasanHarian[]> {
  // TODO [BACKEND INTEGRATION]: Replace with:
  // const endDate = new Date().toISOString().split('T')[0];
  // const startDate = new Date(Date.now() - hariKembali * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  // const response = await fetch(`/api/ringkasan/periode?start=${startDate}&end=${endDate}`);
  // return response.json();

  return getRingkasanPeriode(hariKembali);
}

/**
 * Get summary comparison (today vs yesterday)
 * TODO [BACKEND INTEGRATION]: Replace with:
 * - GET /api/ringkasan/perbandingan
 *
 * @returns Promise<{ today: RingkasanHarian; yesterday: RingkasanHarian; perubahan: { omzet: number; transaksi: number } }>
 */
export async function getPerbandinganRingkasan(): Promise<{
  today: RingkasanHarian;
  yesterday: RingkasanHarian;
  perubahan: {
    omzet: number;
    transaksi: number;
  };
}> {
  // TODO [BACKEND INTEGRATION]: Replace with:
  // const response = await fetch('/api/ringkasan/perbandingan');
  // return response.json();

  const today = await getRingkasanHariIni();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayData = await getRingkasanHarian(yesterday);

  const perubahan = {
    omzet: today.totalOmzet - yesterdayData.totalOmzet,
    transaksi: today.totalTransaksi - yesterdayData.totalTransaksi,
  };

  return { today, yesterday: yesterdayData, perubahan };
}
