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
  getTransaksiPaginated,
  exportTransaksiCSV,
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
export { getLaporan, getPerbandinganKonter } from "./laporanService";

// Ringkasan Services
export {
  getRingkasanHariIni,
  getRingkasanByTanggal,
  getRingkasanPeriodeService,
  getPerbandinganRingkasan,
} from "./ringkasanService";
