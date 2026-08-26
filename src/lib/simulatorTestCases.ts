export interface SkenarioTest {
  nama: string;
  kategori: string;
  provider: "digipos" | "alpines";
  rawText: string;
  ekspektasiValid?: boolean;
}

export const SKENARIO_TESTING: SkenarioTest[] = [
  // ===== PULSA =====
  {
    nama: "Pulsa - format lengkap",
    kategori: "Pulsa",
    provider: "digipos",
    rawText:
      "Isi ulang pulsa Rp 20000 untuk no pelanggan 6285176740026 telah berhasil dengan SN 04224600001707226406 dan ID Transaksi DGPS260726164455775705549",
  },
  {
    nama: "Pulsa - tanpa nominal (SMS backup)",
    kategori: "Pulsa",
    provider: "digipos",
    rawText:
      "Isi ulang pulsa untuk no. 6285176740026 telah berhasil dengan SN: 04224600001707226406 pada 14/08/2026 09:44:37",
  },
  {
    nama: "Pulsa Alpines - Axis Reguler",
    kategori: "Pulsa",
    provider: "alpines",
    rawText:
      "Axis Reguler 30000 AX30.083877750811 Berhasil. SN/Ref: 0092420822554939. Saldo 773.577 - 30.650 = 742.927 @22/08 11:04:47",
  },
  {
    nama: "Pulsa Alpines - Telkomsel BYU",
    kategori: "Pulsa",
    provider: "alpines",
    rawText:
      "Telkomsel BYU 15000 TSBYU15.085198025507 Berhasil. SN/Ref: 04250500000210620925. Saldo 39.777 - 15.550 = 24.227 @21/08 22:34:22",
  },

  // ===== PAKET DATA =====
  {
    nama: "Paket Data - byU Kaget",
    kategori: "Paket Data",
    provider: "digipos",
    rawText:
      "Transaksi pengisian paket data byU Kaget 11 GB 28 Hari 28 Hari pada 12 August 2026 10:17:29 senilai Rp41800 telah berhasil. MSISDN: 6285194309031. ID Transaksi: DGPS260812221726516954578",
  },
  {
    nama: "Paket Data - voucher Combo Sakti",
    kategori: "Paket Data",
    provider: "digipos",
    rawText:
      "Isi ulang paket Combo Sakti 6281266562888 pd 22/08/2026 11:02:04 berhasil. Voucher senilai Rp120000. Nomor seri 04251800000218797388. Cek sisa stock di 181152*PIN#",
  },
  {
    nama: "Paket Data - voucher Super Seru Internet",
    kategori: "Paket Data",
    provider: "digipos",
    rawText:
      "Isi ulang paket Super Seru Internet 6282382402102 pd 22/08/2026 14:50:00 berhasil. Voucher senilai Rp30000. Nomor seri 04251200000226014462. Cek sisa stock di 181152*PIN#.",
  },
  {
    nama: "Paket Data Alpines - Voucher AIGO",
    kategori: "Paket Data",
    provider: "alpines",
    rawText:
      "VOUCHER AIGO 5.5 gb 3 hari *838*nomor voucher#VA5.0838 Berhasil. SN/Ref: :3170 0838 8279 5759. Saldo 309.523 - 11950 = 297.573 @15/08 20:44:39",
  },
  {
    nama: "Paket Data Alpines - Voucher Three",
    kategori: "Paket Data",
    provider: "alpines",
    rawText:
      "Voucher Three 5.5 gb 3 hr *888*Nomor Sn# VTR10.0895 Berhasil. SN/Ref: :4066 3084 4883 9905. Saldo 52.927 - 13150 = 39.777 @21/08 13:23:20",
  },

  // ===== PAKET NELPON =====
  {
    nama: "Paket Nelpon - Talkmania",
    kategori: "Paket Nelpon",
    provider: "digipos",
    rawText:
      "Isi ulang paket Talkmania Sakti Bulanan 6281374087911 pd 21/08/2026 16:04:39 berhasil. Voucher senilai Rp7999. Nomor seri 04250600000200678066. Cek sisa stock di *181*1*5*2*PIN#.",
  },

  // ===== PLN =====
  {
    nama: "PLN - Rp100.000",
    kategori: "PLN",
    provider: "digipos",
    rawText:
      "Anda telah melakukan pembayaran PLN senilai 100000 pada 21-08-2026 09:05:37 Biaya admin 2400. ID Transaksi DGPS260821090524901272902 Saldo LinkAja 70186. Token PLN Prabayar Anda 6925 8840 4057 0985 4046. Nometer 14306947673 atas nama HANSHELA II. 63 kWh",
  },
  {
    nama: "PLN - Rp20.000",
    kategori: "PLN",
    provider: "digipos",
    rawText:
      "Anda telah melakukan pembayaran PLN senilai 20000 pada 15-08-2026 20:06:51 Biaya admin 2400. ID Transaksi DGPS260815200638691929521 Saldo LinkAja 48385. Token PLN Prabayar Anda 0729 7524 0633 7904 1805. Nometer 86031518763 atas nama ALAM SUKDIN. 18,9 kWh",
  },
  {
    nama: "Token Listrik Reseller Alpines (PH)",
    kategori: "PLN",
    provider: "alpines",
    rawText:
      "TOKEN 100000 PH100.50211348581 Berhasil. SN/Ref: 6923-1953-7450-9273-3786/ANDRIKO/B1/1300VA/94.2 Saldo 149.523 - 102.450 = 47.073 @13/08 22:13:53",
  },

  // ===== E-WALLET =====
  {
    nama: "E-wallet DANA - format 1",
    kategori: "E-Wallet",
    provider: "alpines",
    rawText:
      "Saldo DANA50.081261592333 Berhasil. SN/Ref: DANA TOPUP/MXX INDXXXXXX/50000/081261592333/REFF:2026072610121481030100166970654515631. Saldo 998.218 - 50.650 = 947.568 @26/07 21:03:16",
  },
  {
    nama: "E-wallet DANA - format 2 (dengan nama)",
    kategori: "E-Wallet",
    provider: "alpines",
    rawText:
      "Saldo DANA.200.081267746287 Berhasil. SN/Ref: NAMA:DNID-AVRXXXX WIJXXXXXX/NOMINAL:200000/IDT:2026081510121481030100166963767458397. Saldo 731-423 - 200.850 = 530.573 @15/08 13:17:49",
  },
  {
    nama: "E-wallet GoPay",
    kategori: "E-Wallet",
    provider: "alpines",
    rawText:
      "SALDO GOPAY GO100.081372331339 Berhasil. SN/Ref: GOPAY/Jasmisaputra/100000/081372331339/REFF:0420260814154213iJ5AJAncKMID. Saldo 231.173 - 102.150 = 129.023 @14/08 22:42:31",
  },

  // ===== TAGIHAN (Kategori baru dari temuan terbaru) =====
  {
    nama: "Bayar Tagihan Telkom",
    kategori: "Tagihan",
    provider: "alpines",
    rawText:
      "BAYAR TAGIHAN TELKOM BTEL.111452102552 Berhasil. SN/Ref: NOFRITA DEWI/1Lbr/Periode:202608/Rp.318850/979981323608A/Adm2500/RpTag316350/111452102552,. Saldo 409.727 - 319.550 = 90.177 @23/08 20:59:42",
  },

  // ===== GAME TOP-UP =====
  {
    nama: "Game Top-Up - Free Fire",
    kategori: "Game Top-Up",
    provider: "alpines",
    rawText:
      "FREE FIRE FF95.1622224897 Berhasil. SN/Ref: 323a4529-10bb-4c9b-9dfe-65d1af0cd0c7. Saldo 464.923 14.450 450.473 @15/08 13:50:26",
  },

  // ===== KATEGORI BELUM DIKENAL =====
  {
    nama: "Kategori baru - kemunculan pertama (WiFi/Starlink dugaan)",
    kategori: "Kategori Belum Dikenal",
    provider: "alpines",
    rawText:
      "STARLINK PAKET 500RB.081234567890 Berhasil. SN/Ref: ABCDEF123456. Saldo 1.000.000 - 500.000 = 500.000 @22/08 10:00:00",
  },

  // ===== TRANSAKSI GAGAL =====
  {
    nama: "Pulsa - GAGAL (saldo tidak cukup)",
    kategori: "Transaksi Gagal",
    provider: "digipos",
    rawText:
      "Isi ulang pulsa Rp 25000 untuk no pelanggan 6285176740099 GAGAL. Saldo tidak mencukupi. ID Transaksi DGPS260821120000999999999",
  },
  {
    nama: "Paket Data - GAGAL (gangguan koneksi)",
    kategori: "Transaksi Gagal",
    provider: "digipos",
    rawText:
      "Transaksi pengisian paket data byU Kaget 5GB pada 21 August 2026 12:30:00 senilai Rp20000 GAGAL diproses. Terjadi gangguan koneksi. MSISDN: 6281234567897.",
  },
  {
    nama: "PLN - GAGAL (gangguan sistem)",
    kategori: "Transaksi Gagal",
    provider: "digipos",
    rawText:
      "Maaf, transaksi PLN untuk nometer 14306947999 tidak dapat diproses karena gangguan sistem PLN. Silakan coba beberapa saat lagi.",
  },

  // ===== NOTIFIKASI PENDING ALPINES (HARUS DIABAIKAN TOTAL) =====
  {
    nama: "[HARUS DIABAIKAN] Pending - Voucher Three",
    kategori: "Pending Alpines (Harus Diabaikan)",
    provider: "alpines",
    rawText:
      "Voucher Three 5.5 gb 3 hr *888*Nomor Sn# VTR10.0895 akan diproses @13:23. Tunggu SMS notifikasi sebelum penggunaan",
  },
  {
    nama: "[HARUS DIABAIKAN] Pending - Axis Reguler",
    kategori: "Pending Alpines (Harus Diabaikan)",
    provider: "alpines",
    rawText:
      "Axis Reguler 30000 AX30.083877750811 akan diproses @11:04. Tunggu SMS notifikasi sebelum penggunaan.",
  },
  {
    nama: "[HARUS DIABAIKAN] Pending - Telkomsel BYU (dengan line break)",
    kategori: "Pending Alpines (Harus Diabaikan)",
    provider: "alpines",
    rawText:
      "Telkomsel BYU 15000 TSBYU15.085198025507\nakan diproses @22:34.\nTunggu SMS notifikasi sebelum penggunaan.",
  },

  // ===== DIGIPOS PENDING (TETAP MASUK, BEDA DARI ALPINES) =====
  {
    nama: "Digipos - sistem sibuk (TETAP masuk sebagai pending, bukan diabaikan)",
    kategori: "Pending Digipos (Tetap Masuk)",
    provider: "digipos",
    rawText:
      "Transaksi sedang dalam peningkatan koneksi, mohon dicoba lagi nanti. ID Transaksi: DGPS260815123456",
  },

  // ===== NOTIFIKASI NON-TRANSAKSI (HARUS DIABAIKAN TOTAL) =====
  {
    nama: "HOT PROMO (nama produk mengandung kata 'promo', HARUS tetap valid sebagai transaksi)",
    kategori: "Paket Data",
    provider: "digipos",
    rawText:
      "Isi ulang paket HOT PROMO 6285213742324 pd 25/08/2026 08:56:41 berhasil. Voucher senilai Rp30000. Nomor seri 04254000000275319660. Cek sisa stock di *181*1*5*2*PIN#.",
    ekspektasiValid: true,
  },
  {
    nama: "REGRESI: Gebyar Merdeka tetap harus ditolak walau ada perubahan urutan cek",
    kategori: "Promo/Info (Harus Diabaikan)",
    provider: "digipos",
    rawText:
      "Gebyar Merdeka Digipos 17.8.45! Yuk, kerjar taget transaksinya dan raih hadiah Rp 1.781.945! Penuhi target selama periode 17 Agustus - 17 September 2026.",
    ekspektasiValid: false,
  },
  {
    nama: "[HARUS DIABAIKAN] Promo - Gebyar Merdeka",
    kategori: "Promo/Info (Harus Diabaikan)",
    provider: "digipos",
    rawText:
      "Gebyar Merdeka Digipos 17.8.45! Yuk, kerjar taget transaksinya dan raih hadiah Rp 1.781.945! Penuhi target selama periode 17 Agustus - 17 September 2026.",
  },
  {
    nama: "[HARUS DIABAIKAN] Promo - Cashback",
    kategori: "Promo/Info (Harus Diabaikan)",
    provider: "alpines",
    rawText:
      "Selamat! Anda mendapat cashback 10rb untuk transaksi berikutnya. Yuk gunakan sebelum promo berakhir!",
  },
  {
    nama: "[HARUS DIABAIKAN] Top-up saldo aplikasi sendiri",
    kategori: "Promo/Info (Harus Diabaikan)",
    provider: "alpines",
    rawText:
      "Deposit Anda sebesar Rp500.000 telah berhasil ditambahkan ke saldo Alpines. Saldo sekarang: Rp1.200.000",
  },
  {
    nama: "[HARUS DIABAIKAN] Info maintenance",
    kategori: "Promo/Info (Harus Diabaikan)",
    provider: "digipos",
    rawText:
      "Info: Aplikasi Digipos akan mengalami maintenance pada 22 Agustus 2026 pukul 00:00-02:00 WIB",
  },

  // ===== UJI DUPLIKAT (KIRIM YANG SAMA 2X BERTURUT-TURUT SECARA MANUAL) =====
  {
    nama: "[TES DUPLIKAT] Kirim ini 2-3x berturut-turut, harus tetap 1 baris",
    kategori: "Uji Duplikat Alpines",
    provider: "alpines",
    rawText:
      "SALDO OVO OV50.081200001111 Berhasil. SN/Ref: OVOTEST123456789. Saldo 100.000 - 50.000 = 50.000 @23/08 12:00:00",
  },

  // ===== KASUS EKSTREM =====
  {
    nama: "[HARUS TETAP TERSIMPAN] Format benar-benar asing",
    kategori: "Kasus Ekstrem",
    provider: "alpines",
    rawText: "asdkjaskjd 12345 test random text tidak jelas",
  },
];
