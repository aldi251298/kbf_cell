export type StatusTransaksi = "sukses" | "gagal" | "pending";

export type KategoriTransaksi =
  | "pulsa"
  | "paket_nelpon"
  | "paket_data"
  | "pln"
  | "ewallet"
  | "ewallet_dana"
  | "voucher"
  | "voucher_fisik"
  | "game_topup"
  | "wifi"
  | "tv_kabel"
  | "pdam"
  | "token_listrik_reseller"
  | "pulsa_op"
  | "data"
  | "p2p"
  | "ppob"
  | "gametopup"
  | "keuangan"
  | "belum_dikenal"
  | `lainnya_${string}`;

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
  konterId: string | null; // ID konter/device asal (nullable untuk data legacy/unknown)
  konterNama: string; // nama konter (denormalized untuk kemudahan)
  nomorTujuan: string; // nomor tujuan transaksi (untuk pulsa, data, p2p, pln)
  produk: {
    nama: string; // nama produk
    kategori: KategoriTransaksi;
    nominal: number; // nominal/value produk
  };
  nominal: number; // jumlah uang yang dibayar
  status: StatusTransaksi;
  sn: string; // serial number transaksi
  providerSeluler?: string; // operator seluler (untuk pulsa)
  namaPemilik?: string; // nama pemilik e-wallet (untuk ewallet)
  perluReview?: boolean; // perlu review manual
  detail?: TransaksiDetail & { saldo_akhir?: number }; // detail tambahan tergantung jenis transaksi
  errorMessage?: string; // jika gagal/pending
  detailTambahan?: {
    alasan_review?: string;
    raw_text_history?: string[];
  };
  provider?: string; // provider transaksi (digipos, alpines, dll)
}
