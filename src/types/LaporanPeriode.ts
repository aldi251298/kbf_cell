export type ModeLaporan = "harian" | "bulanan" | "tahunan";

export interface LaporanPeriode {
  mode: ModeLaporan;
  periode: string; // e.g., "2025-01" for bulanan, "2025" for tahunan
  data: {
    tanggal?: Date; // untuk harian
    bulan?: number; // untuk tahunan
    omzet: number;
    jumlahTransaksi: number;
    rataRataNilai: number;
    tertinggi?: number; // hari/bulan tertinggi omzet
    terendah?: number;
  }[];
  agregat: {
    totalOmzet: number;
    totalTransaksi: number;
    rataRataOmzet: number;
    hariAktif: number;
    hariTidakTransaksi: number;
  };
}
