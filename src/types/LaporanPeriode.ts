export type ModeLaporan = "harian" | "bulanan" | "tahunan";

export interface BreakdownJenisTransaksi {
  jenisTransaksi: string;
  label: string;
  icon: string; // lucide icon name untuk referensi
  omzet: number;
  margin: number; // SUM(admin_konter)
  jumlahTransaksi: number;
  persentaseOmzet: number;
  persentaseMargin: number;
}

export interface LaporanPeriode {
  mode: ModeLaporan;
  periode: string; // e.g., "2025-01" for harian, "2025" for bulanan/tahunan
  data: {
    tanggal?: Date; // untuk harian
    bulan?: number; // untuk bulanan
    omzet: number;
    jumlahTransaksi: number;
    rataRataNilai: number;
    tertinggi?: number; // hari/bulan tertinggi omzet
    terendah?: number;
    // breakdown per jenis transaksi untuk periode ini
    breakdownJenisTransaksi?: BreakdownJenisTransaksi[];
  }[];
  agregat: {
    totalOmzet: number;
    totalTransaksi: number;
    rataRataOmzet: number;
    hariAktif: number;
    hariTidakTransaksi: number;
    totalMargin: number; // SUM(admin_konter) seluruh periode
    transaksiTertinggi: number; // nominal transaksi tertinggi
    transaksiTerendah: number; // nominal transaksi terendah (sukses only)
  };
  // breakdown keseluruhan periode
  breakdownJenisTransaksi: BreakdownJenisTransaksi[];
}
