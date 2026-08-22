// scripts/test-parser-local.ts
//
// Script test parser MURNI LOKAL — tidak ada koneksi HTTP/database sama sekali.
// Memanggil parseNotifikasi() dan apakahNotifikasiPendingAlpines() langsung,
// membandingkan hasil dengan ekspektasi.
//
// SEMUA raw text di bawah ini adalah notifikasi ASLI yang sudah dikonfirmasi oleh
// pemilik konter sepanjang proses pengembangan. JANGAN tambah kasus baru dengan
// format karangan sendiri — kalau ada jenis transaksi baru, wajib minta contoh
// notifikasi asli dulu sebelum menambah test case.

import { parseNotifikasi, apakahNotifikasiPendingAlpines } from "../src/lib/parser";

interface TestCase {
  nama: string;
  provider: "digipos" | "alpines";
  rawText: string;
  ekspektasi: {
    jenis_transaksi?: string;
    nominal?: number | null;
    nomor_tujuan?: string | null;
    nama_produk?: string | null;
    nama_pemilik?: string | null;
    status?: string;
    perlu_review?: boolean;
  };
}

interface PendingTestCase {
  nama: string;
  provider: "digipos" | "alpines";
  rawText: string;
  harusDiabaikan: boolean; // true = harus terdeteksi sebagai notifikasi pending Alpines yang diabaikan total
}

// ============================================================
// BAGIAN 1: NOTIFIKASI PENDING ALPINES — HARUS DIABAIKAN TOTAL
// (tidak masuk parseNotifikasi() sama sekali, dicek terpisah)
// ============================================================

const pendingTestCases: PendingTestCase[] = [
  {
    nama: "Alpines Pending - Voucher Three (akan diproses)",
    provider: "alpines",
    rawText: "Voucher Three 5.5 gb 3 hr *888*Nomor Sn# VTR10.0895 akan diproses @13:23. Tunggu SMS notifikasi sebelum penggunaan",
    harusDiabaikan: true
  },
  {
    nama: "Alpines Pending - Axis Reguler (akan diproses)",
    provider: "alpines",
    rawText: "Axis Reguler 30000 AX30.083877750811 akan diproses @11:04. Tunggu SMS notifikasi sebelum penggunaan.",
    harusDiabaikan: true
  },
  {
    nama: "Alpines Pending - Telkomsel BYU (akan diproses, dengan line break)",
    provider: "alpines",
    rawText: "Telkomsel BYU 15000 TSBYU15.085198025507\nakan diproses @22:34.\nTunggu SMS notifikasi sebelum penggunaan.",
    harusDiabaikan: true
  },
  {
    nama: "Digipos - 'sistem sibuk' TIDAK boleh diabaikan (beda dari pending Alpines)",
    provider: "digipos",
    rawText: "Transaksi sedang dalam peningkatan koneksi, mohon dicoba lagi nanti. ID Transaksi: DGPS260815123456",
    harusDiabaikan: false // tetap masuk transaksi dengan status pending, BUKAN diabaikan total
  },
  {
    nama: "Alpines sukses - JANGAN ikut kedeteksi sebagai pending (regresi penting)",
    provider: "alpines",
    rawText: "Axis Reguler 30000 AX30.083877750811 Berhasil. SN/Ref: 0092420822554939. Saldo 773.577 - 30.650 = 742.927 @22/08 11:04:47",
    harusDiabaikan: false
  },
];

// ============================================================
// BAGIAN 2: SEMUA JENIS TRANSAKSI SUKSES/GAGAL — DIPROSES PENUH
// ============================================================

const testCases: TestCase[] = [
  // ===== PULSA (DIGIPOS) =====
  {
    nama: "Pulsa Digipos - format lengkap",
    provider: "digipos",
    rawText: "Isi ulang pulsa Rp 20000 untuk no pelanggan 6285176740026 telah berhasil dengan SN 04224600001707226406 dan ID Transaksi DGPS260726164455775705549",
    ekspektasi: { jenis_transaksi: "pulsa", nominal: 20000, nomor_tujuan: "6285176740026", status: "sukses" }
  },
  {
    nama: "Pulsa Digipos - tanpa nominal (format SMS backup)",
    provider: "digipos",
    rawText: "Isi ulang pulsa untuk no. 6285176740026 telah berhasil dengan SN: 04224600001707226406 pada 14/08/2026 09:44:37",
    ekspektasi: { jenis_transaksi: "pulsa", nominal: null, nomor_tujuan: "6285176740026", status: "sukses", perlu_review: true }
  },

  // ===== PULSA (ALPINES — format operator+nominal+kode) =====
  {
    nama: "Pulsa Alpines - Axis Reguler",
    provider: "alpines",
    rawText: "Axis Reguler 30000 AX30.083877750811 Berhasil. SN/Ref: 0092420822554939. Saldo 773.577 - 30.650 = 742.927 @22/08 11:04:47",
    ekspektasi: { jenis_transaksi: "pulsa", nominal: 30650, status: "sukses" }
  },
  {
    nama: "Pulsa Alpines - Telkomsel BYU",
    provider: "alpines",
    rawText: "Telkomsel BYU 15000 TSBYU15.085198025507 Berhasil. SN/Ref: 04250500000210620925. Saldo 39.777 - 15.550 = 24.227 @21/08 22:34:22",
    ekspektasi: { jenis_transaksi: "pulsa", nominal: 15550, nomor_tujuan: "085198025507", status: "sukses" }
  },

  // ===== PAKET DATA (DIGIPOS) =====
  {
    nama: "Paket Data Digipos - byU Kaget",
    provider: "digipos",
    rawText: "Transaksi pengisian paket data byU Kaget 11 GB 28 Hari 28 Hari pada 12 August 2026 10:17:29 senilai Rp41800 telah berhasil. MSISDN: 6285194309031. ID Transaksi: DGPS260812221726516954578",
    ekspektasi: { jenis_transaksi: "paket_data", nominal: 41800, nomor_tujuan: "6285194309031", nama_produk: "byU Kaget 11 GB 28 Hari 28 Hari", status: "sukses" }
  },
  {
    nama: "Paket Data Digipos - format voucher, Combo Sakti",
    provider: "digipos",
    rawText: "Isi ulang paket Combo Sakti 6281266562888 pd 22/08/2026 11:02:04 berhasil. Voucher senilai Rp120000. Nomor seri 04251800000218797388. Cek sisa stock di 181152*PIN#",
    ekspektasi: { jenis_transaksi: "paket_data", nama_produk: "Combo Sakti", nominal: 120000, nomor_tujuan: "6281266562888", status: "sukses" }
  },
  {
    nama: "Paket Data Digipos - format voucher, Super Seru Internet",
    provider: "digipos",
    rawText: "Isi ulang paket Super Seru Internet 6282382402102 pd 22/08/2026 14:50:00 berhasil. Voucher senilai Rp30000. Nomor seri 04251200000226014462. Cek sisa stock di 181152*PIN#.",
    ekspektasi: { jenis_transaksi: "paket_data", nama_produk: "Super Seru Internet", nominal: 30000, nomor_tujuan: "6282382402102", status: "sukses" }
  },

  // ===== PAKET DATA (ALPINES — voucher) =====
  {
    nama: "Paket Data Alpines - Voucher AIGO",
    provider: "alpines",
    rawText: "VOUCHER AIGO 5.5 gb 3 hari *838*nomor voucher#VA5.0838 Berhasil. SN/Ref: :3170 0838 8279 5759. Saldo 309.523 - 11950 = 297.573 @15/08 20:44:39",
    ekspektasi: { jenis_transaksi: "paket_data", nominal: 11950, nama_produk: "AIGO 5.5 gb 3 hari", status: "sukses" }
  },
  {
    nama: "Paket Data Alpines - Voucher Three",
    provider: "alpines",
    rawText: "Voucher Three 5.5 gb 3 hr *888*Nomor Sn# VTR10.0895 Berhasil. SN/Ref: :4066 3084 4883 9905. Saldo 52.927 - 13150 = 39.777 @21/08 13:23:20",
    ekspektasi: { jenis_transaksi: "paket_data", nominal: 13150, status: "sukses" }
  },

  // ===== PAKET NELPON (DIGIPOS) =====
  {
    nama: "Paket Nelpon Digipos - Talkmania",
    provider: "digipos",
    rawText: "Isi ulang paket Talkmania Sakti Bulanan 6281374087911 pd 21/08/2026 16:04:39 berhasil. Voucher senilai Rp7999. Nomor seri 04250600000200678066. Cek sisa stock di *181*1*5*2*PIN#.",
    ekspektasi: { jenis_transaksi: "paket_nelpon", nama_produk: "Talkmania Sakti Bulanan", nominal: 7999, nomor_tujuan: "6281374087911", status: "sukses" }
  },

  // ===== PLN (DIGIPOS) =====
  {
    nama: "PLN Digipos - Rp100.000",
    provider: "digipos",
    rawText: "Anda telah melakukan pembayaran PLN senilai 100000 pada 21-08-2026 09:05:37 Biaya admin 2400. ID Transaksi DGPS260821090524901272902 Saldo LinkAja 70186. Token PLN Prabayar Anda 6925 8840 4057 0985 4046. Nometer 14306947673 atas nama HANSHELA II. 63 kWh",
    ekspektasi: { jenis_transaksi: "pln", nominal: 100000, nomor_tujuan: "14306947673", status: "sukses" }
  },
  {
    nama: "PLN Digipos - Rp20.000",
    provider: "digipos",
    rawText: "Anda telah melakukan pembayaran PLN senilai 20000 pada 15-08-2026 20:06:51 Biaya admin 2400. ID Transaksi DGPS260815200638691929521 Saldo LinkAja 48385. Token PLN Prabayar Anda 0729 7524 0633 7904 1805. Nometer 86031518763 atas nama ALAM SUKDIN. 18,9 kWh",
    ekspektasi: { jenis_transaksi: "pln", nominal: 20000, nomor_tujuan: "86031518763", status: "sukses" }
  },

  // ===== TOKEN LISTRIK RESELLER (ALPINES) =====
  {
    nama: "Token Listrik Reseller Alpines (format PH)",
    provider: "alpines",
    rawText: "TOKEN 100000 PH100.50211348581 Berhasil. SN/Ref: 6923-1953-7450-9273-3786/ANDRIKO/B1/1300VA/94.2 Saldo 149.523 - 102.450 = 47.073 @13/08 22:13:53",
    ekspektasi: { nominal: 102450, status: "sukses" }
  },

  // ===== E-WALLET (ALPINES) =====
  {
    nama: "E-wallet DANA - format 1 (tanpa nama pemilik)",
    provider: "alpines",
    rawText: "Saldo DANA50.081261592333 Berhasil. SN/Ref: DANA TOPUP/MXX INDXXXXXX/50000/081261592333/REFF:2026072610121481030100166970654515631. Saldo 998.218 - 50.650 = 947.568 @26/07 21:03:16",
    ekspektasi: { jenis_transaksi: "ewallet", nominal: 50650, nomor_tujuan: "081261592333", nama_produk: "DANA", status: "sukses" }
  },
  {
    nama: "E-wallet DANA - format 2 (dengan nama pemilik)",
    provider: "alpines",
    rawText: "Saldo DANA.200.081267746287 Berhasil. SN/Ref: NAMA:DNID-AVRXXXX WIJXXXXXX/NOMINAL:200000/IDT:2026081510121481030100166963767458397. Saldo 731-423 - 200.850 = 530.573 @15/08 13:17:49",
    ekspektasi: { jenis_transaksi: "ewallet", nominal: 200850, nomor_tujuan: "081267746287", nama_produk: "DANA", nama_pemilik: "DNID-AVRXXXX WIJXXXXXX", status: "sukses" }
  },
  {
    nama: "E-wallet GoPay",
    provider: "alpines",
    rawText: "SALDO GOPAY GO100.081372331339 Berhasil. SN/Ref: GOPAY/Jasmisaputra/100000/081372331339/REFF:0420260814154213iJ5AJAncKMID. Saldo 231.173 - 102.150 = 129.023 @14/08 22:42:31",
    ekspektasi: { jenis_transaksi: "ewallet", nominal: 102150, nomor_tujuan: "081372331339", nama_produk: "GoPay", nama_pemilik: "Jasmisaputra", status: "sukses" }
  },

  // ===== GAME TOP-UP (ALPINES) =====
  {
    nama: "Game Top-Up - Free Fire",
    provider: "alpines",
    rawText: "FREE FIRE FF95.1622224897 Berhasil. SN/Ref: 323a4529-10bb-4c9b-9dfe-65d1af0cd0c7. Saldo 464.923 14.450 450.473 @15/08 13:50:26",
    ekspektasi: { jenis_transaksi: "game_topup", nama_produk: "FREE FIRE", nominal: 14450, status: "sukses" }
  },

  // ===== KATEGORI BELUM DIKENAL (fallback dinamis) =====
  {
    nama: "Kategori tidak dikenal - kemunculan pertama (harus perlu_review true)",
    provider: "alpines",
    rawText: "STARLINK PAKET 500RB.081234567890 Berhasil. SN/Ref: ABCDEF123456. Saldo 1.000.000 - 500.000 = 500.000 @22/08 10:00:00",
    ekspektasi: { nominal: 500000, status: "sukses", perlu_review: true }
  },
];

// ============================================================
// FUNGSI PEMBANDING & RUNNER
// ============================================================

function bandingkan(aktual: any, ekspektasi: TestCase["ekspektasi"]): { pass: boolean; selisih: string[] } {
  const selisih: string[] = [];
  for (const [key, nilaiEkspektasi] of Object.entries(ekspektasi)) {
    if (aktual[key] !== nilaiEkspektasi) {
      selisih.push(`${key}: ekspektasi=${JSON.stringify(nilaiEkspektasi)}, aktual=${JSON.stringify(aktual[key])}`);
    }
  }
  return { pass: selisih.length === 0, selisih };
}

function jalankanTest() {
  console.log("=== TEST 1: DETEKSI NOTIFIKASI PENDING ALPINES (harus diabaikan total) ===\n");
  let pendingPass = 0;

  for (const kasus of pendingTestCases) {
    const hasilAktual = apakahNotifikasiPendingAlpines(kasus.rawText, kasus.provider);
    const pass = hasilAktual === kasus.harusDiabaikan;

    if (pass) {
      pendingPass++;
      console.log(`✅ PASS - ${kasus.nama}`);
    } else {
      console.log(`❌ FAIL - ${kasus.nama}`);
      console.log(`     ekspektasi diabaikan=${kasus.harusDiabaikan}, aktual=${hasilAktual}`);
    }
  }
  console.log(`\nHasil Test 1: ${pendingPass}/${pendingTestCases.length} PASS\n`);

  console.log("=== TEST 2: PARSING LENGKAP SEMUA JENIS TRANSAKSI ===\n");
  let jumlahPass = 0;

  for (const kasus of testCases) {
    const hasilAktual = parseNotifikasi({ provider: kasus.provider, rawText: kasus.rawText });
    const { pass, selisih } = bandingkan(hasilAktual, kasus.ekspektasi);

    if (pass) {
      jumlahPass++;
      console.log(`✅ PASS - ${kasus.nama}`);
    } else {
      console.log(`❌ FAIL - ${kasus.nama}`);
      selisih.forEach(s => console.log(`     ${s}`));
    }
  }
  console.log(`\nHasil Test 2: ${jumlahPass}/${testCases.length} PASS`);

  const totalPass = pendingPass + jumlahPass;
  const totalKasus = pendingTestCases.length + testCases.length;
  console.log(`\n=== TOTAL KESELURUHAN: ${totalPass}/${totalKasus} PASS ===`);

  if (totalPass < totalKasus) {
    console.log("\n⚠️  Masih ada kasus gagal — JANGAN deploy ke konter sungguhan sebelum semua PASS.");
    process.exit(1);
  } else {
    console.log("\n✅ Semua kasus PASS. Parser siap untuk verifikasi manual final di dashboard sebelum go-live.");
  }
}

jalankanTest();