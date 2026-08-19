/**
 * Fixtures / Dummy Data — TESTING ONLY
 *
 * These generators were used in Phase 1 (frontend) to simulate data before the
 * backend existed. They are kept here for local testing/seed purposes only and
 * are NOT used in the production data path. The production services
 * (src/services/*) now read real data from Supabase via API routes.
 *
 * Do NOT import from this folder in production code paths.
 */

export {
  KONTER_LIST,
  getKonterById,
  getKonterByPerangkatId,
} from "./konterData";
export { PERANGKAT_LIST, getRiwayatStatusPerangkat } from "./perangkatData";
export {
  generateTransaksiData,
  filterTransaksiData,
  getTransaksiHariIni,
} from "./transaksiData";
export { getRingkasanHarian, getRingkasanPeriode } from "./ringkasanData";
export { getLaporanPeriode } from "./laporanData";
