export interface RingkasanHarian {
  tanggal: Date;
  totalOmzet: number;
  totalTransaksi: number;
  rataRataNilaiTransaksi: number;
  transaksiPerStatus: {
    sukses: number;
    gagal: number;
    pending: number;
  };
  kontribusiPerKonter: {
    konterId: string;
    konterNama: string;
    omzet: number;
    jumlahTransaksi: number;
  }[];
  // Fase 2.7: Pendapatan bersih dari biaya admin konter
  pendapatanBersih: number;
}
