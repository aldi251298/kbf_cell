/**
 * Laporan Service Layer
 *
 * TODO [BACKEND INTEGRATION]: Replace fake data calls with actual API endpoints:
 * - GET    /api/laporan/harian?month=2025-01 -> daily report
 * - GET    /api/laporan/bulanan?year=2025    -> monthly report
 * - GET    /api/laporan/tahunan              -> yearly report
 * - GET    /api/laporan/perbandingan         -> comparison report
 *
 * Current implementation uses fake data generator from 'src/data/laporanData'
 */

import { getLaporanPeriode } from "@/data/laporanData";
import type { ModeLaporan, LaporanPeriode } from "@/types";

/**
 * Get period report (daily/monthly/yearly)
 * @param mode - Report mode
 * @param periode - Period identifier (YYYY-MM for harian, YYYY for bulanan/tahunan)
 * @returns Promise<LaporanPeriode>
 */
export async function getLaporan(
  mode: ModeLaporan,
  periode: string,
): Promise<LaporanPeriode> {
  // TODO [BACKEND INTEGRATION]: Replace with:
  // let endpoint = '';
  // switch (mode) {
  //   case 'harian':
  //     endpoint = `/api/laporan/harian?month=${periode}`;
  //     break;
  //   case 'bulanan':
  //     endpoint = `/api/laporan/bulanan?year=${periode}`;
  //     break;
  //   case 'tahunan':
  //     endpoint = '/api/laporan/tahunan';
  //     break;
  // }
  // const response = await fetch(endpoint);
  // return response.json();

  return getLaporanPeriode(mode, periode);
}

/**
 * Get comparison data between counters
 * TODO [BACKEND INTEGRATION]: Replace with:
 * - GET /api/laporan/perbandingan?mode=harian&periode=2025-01
 *
 * @param mode - Report mode
 * @param periode - Period identifier
 * @returns Promise<{ konterId: string; konterNama: string; omzet: number; jumlahTransaksi: number }[]>
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
  // TODO [BACKEND INTEGRATION]: Replace with:
  // const response = await fetch(`/api/laporan/perbandingan?mode=${mode}&periode=${periode}`);
  // return response.json();

  const laporan = await getLaporan(mode, periode);

  // Simulate counter contribution breakdown
  const totalOmzet = laporan.agregat.totalOmzet;

  return [
    {
      konterId: "KONTER-001",
      konterNama: "KBF Cell Pasar Baru",
      omzet: Math.round(totalOmzet * 0.42),
      jumlahTransaksi: Math.round(laporan.agregat.totalTransaksi * 0.4),
      persentase: 42,
    },
    {
      konterId: "KONTER-002",
      konterNama: "KBF Cell Jawi Jawi",
      omzet: Math.round(totalOmzet * 0.35),
      jumlahTransaksi: Math.round(laporan.agregat.totalTransaksi * 0.38),
      persentase: 35,
    },
    {
      konterId: "KONTER-003",
      konterNama: "KBF Cell Cupak",
      omzet: Math.round(totalOmzet * 0.23),
      jumlahTransaksi: Math.round(laporan.agregat.totalTransaksi * 0.22),
      persentase: 23,
    },
  ];
}
