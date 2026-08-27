/**
 * Types for Laporan Analytics Dashboard (Fase 2.9)
 * New types for the redesigned analytics page with charts and deep analysis
 */

export type PeriodeFilter =
  "hari_ini" | "7_hari" | "30_hari" | "bulan_ini" | "custom";

export interface FilterLaporan {
  periode: PeriodeFilter;
  tanggalMulai?: Date;
  tanggalSelesai?: Date;
  konterId: string; // "semua" atau ID spesifik
  provider: string; // "semua" | "digipos" | "alpines" | "manual"
}

export interface RingkasanLaporan {
  totalOmzet: number;
  totalPendapatanBersih: number;
  totalTransaksi: number;
  rataRataPerTransaksi: number;
}

export interface TrenHarianData {
  tanggal: string; // YYYY-MM-DD
  omzet: number;
  pendapatanBersih: number;
  jumlahTransaksi: number;
}

export interface BreakdownJenisTransaksi {
  jenis: string;
  label: string;
  jumlahTransaksi: number;
  totalOmzet: number;
  totalAdmin: number;
  persentaseOmzet: number;
}

export interface PerbandinganKonter {
  konterId: string;
  namaKonter: string;
  totalOmzet: number;
  totalAdmin: number;
  jumlahTransaksi: number;
  persentaseOmzet: number;
}

export interface TopProduk {
  namaProduk: string;
  jumlahTerjual: number;
  totalOmzet: number;
}

export interface DistribusiJam {
  jam: number; // 0-23
  jumlahTransaksi: number;
}

export interface LaporanAnalyticsData {
  ringkasan: RingkasanLaporan;
  trenHarian: TrenHarianData[];
  breakdownJenis: BreakdownJenisTransaksi[];
  perbandinganKonter: PerbandinganKonter[];
  topProduk: TopProduk[];
  distribusiJam: DistribusiJam[];
}

export interface TransaksiExportRow {
  waktu: string;
  konter: string;
  jenis: string;
  produk: string;
  nominal: number;
  adminKonter: number;
  status: string;
  tujuan: string;
}
