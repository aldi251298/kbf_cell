/**
 * Client-side service for Laporan Analytics (Fase 2.9)
 * Calls the /api/laporan-analytics endpoint
 */

import type {
  FilterLaporan,
  LaporanAnalyticsData,
} from "@/types/laporanAnalytics";

const API_BASE = "/api/laporan-analytics";

function buildQueryString(filter: FilterLaporan): string {
  const params = new URLSearchParams();
  params.set("periode", filter.periode);
  params.set("konterId", filter.konterId);
  params.set("provider", filter.provider);
  if (filter.tanggalMulai) {
    params.set("tanggalMulai", filter.tanggalMulai.toISOString());
  }
  if (filter.tanggalSelesai) {
    params.set("tanggalSelesai", filter.tanggalSelesai.toISOString());
  }
  return params.toString();
}

/**
 * Fetch all analytics data for the dashboard
 */
export async function getLaporanAnalytics(
  filter: FilterLaporan,
): Promise<LaporanAnalyticsData> {
  const queryString = buildQueryString(filter);
  const res = await fetch(`${API_BASE}?${queryString}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Gagal mengambil data laporan analytics.");
  }
  return res.json();
}

/**
 * Export analytics data to CSV
 */
export async function exportLaporanAnalyticsCsv(
  filter: FilterLaporan,
): Promise<Blob> {
  const queryString = buildQueryString(filter);
  const res = await fetch(`${API_BASE}?${queryString}&export=true`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Gagal mengekspor data laporan.");
  }
  return res.blob();
}

/**
 * Generate descriptive filename for CSV export
 */
export function generateLaporanAnalyticsExportFilename(
  filter: FilterLaporan,
): string {
  const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
  return `Laporan-Analytics-${filter.periode}-${dateStr}.csv`;
}
