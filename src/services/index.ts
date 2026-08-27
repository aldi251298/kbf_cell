/**
 * Service Layer Barrel Export
 *
 * This is the single point of data access for all UI components.
 * When backend integration begins (Phase 2+), only the internal
 * implementation of these services needs to change.
 *
 * TODO [BACKEND INTEGRATION]: See individual service files for
 * specific endpoints that need to be connected.
 */

// Transaksi Services
export {
  getTransaksi,
  getTransaksiHariIniService,
  getTransaksiByDateRange,
  getTransaksiPaginatedByDateRange,
  getTransaksiPaginated,
  exportTransaksiExcel,
  generateExportFilename,
  addTransaksiManual,
} from "./transaksiService";

// Perangkat Services
export {
  getPerangkat,
  getPerangkatById,
  getPerangkatHistory,
  subscribePerangkatStatus,
  getKonterList,
} from "./perangkatService";

// Laporan Services
export {
  getLaporan,
  getPerbandinganKonter,
  exportLaporanExcel,
  generateLaporanExportFilename,
} from "./laporanService";

// Laporan Analytics Services (Fase 2.9)
export {
  getLaporanAnalytics,
  exportLaporanAnalyticsCsv,
  generateLaporanAnalyticsExportFilename,
} from "./laporanAnalyticsClient";

// Ringkasan Services
export {
  getRingkasanHariIni,
  getRingkasanByTanggal,
  getRingkasanByDateRange,
  getRingkasanPeriodeService,
  getPerbandinganRingkasan,
} from "./ringkasanService";
