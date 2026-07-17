export type StatusTransaksi = "sukses" | "gagal" | "pending";

export type KategoriTransaksi =
  | "pulsa"
  | "data"
  | "voucher"
  | "p2p"
  | "ewallet"
  | "ppob"
  | "gametopup"
  | "keuangan";

export interface TransaksiDetail {
  nomorTujuan?: string;
  rekeningTujuan?: string;
  namaPenerima?: string;
  platform?: string; // untuk e-wallet, game, dll
  jenisPembayaran?: string; // untuk PPOB (PLN, PDAM, BPJS, dll)
  idGame?: string; // untuk top-up game
  namaProduk?: string; // nama produk yang dibeli
}

export interface Transaksi {
  id: string;
  waktu: Date; // timestamp transaksi
  konterId: string; // ID konter/device asal
  konterNama: string; // nama konter (denormalized untuk kemudahan)
  nomorTujuan: string; // nomor tujuan transaksi (untuk pulsa, data, p2p)
  produk: {
    nama: string; // nama produk
    kategori: KategoriTransaksi;
    nominal: number; // nominal/value produk
  };
  nominal: number; // jumlah uang yang dibayar
  status: StatusTransaksi;
  sn: string; // serial number transaksi
  detail?: TransaksiDetail; // detail tambahan tergantung jenis transaksi
  errorMessage?: string; // jika gagal/pending
}
