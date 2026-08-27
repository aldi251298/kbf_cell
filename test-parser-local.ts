/**
 * Local Parser Test Suite
 *
 * Run with: npx ts-node test-parser-local.ts
 * Or: npx jest test-parser-local.ts
 */

import {
  apakahNotifikasiPendingAlpines,
  pisahkanSaldoAplikasi,
  apakahTransaksiPelanggan,
} from "./src/lib/parser/universal";
import { ekstraksiNominalDasarAlpines } from "./src/lib/parser/extractNominal";
import { terapkanAdminKonter } from "./src/lib/parser/adminKonter";
import { parseNotifikasi } from "./src/lib/parser/index";

// ============================================================================
// Test Types
// ============================================================================

interface PendingTestCase {
  nama: string;
  provider: "alpines" | "digipos";
  rawText: string;
  harusDiabaikan: boolean;
}

interface NonTransaksiTestCase {
  nama: string;
  provider: "alpines" | "digipos";
  rawText: string;
  ekspektasiValid: boolean;
}

interface NominalTestCase {
  nama: string;
  provider: "alpines" | "digipos";
  rawText: string;
  jenisTransaksi: string;
  namaProduk: string | null;
  nominalDasar: number;
  sumberDasar: string | undefined;
  adminKonter: number;
  nominalFinal: number;
}

// ============================================================================
// Test Cases - Alpines Pending (Step 4 - Langkah 4)
// ============================================================================

const pendingTestCases: PendingTestCase[] = [
  {
    nama: "Alpines Pending - Voucher Three",
    provider: "alpines",
    rawText:
      "Voucher Three 5.5 gb 3 hr *888*Nomor Sn# VTR10.0895 akan diproses @13:23. Tunggu SMS notifikasi sebelum penggunaan",
    harusDiabaikan: true,
  },
  {
    nama: "Alpines Pending - Axis Reguler",
    provider: "alpines",
    rawText:
      "Axis Reguler 30000 AX30.083877750811 akan diproses @11:04. Tunggu SMS notifikasi sebelum penggunaan.",
    harusDiabaikan: true,
  },
  {
    nama: "Digipos 'sistem sibuk' - TETAP masuk sebagai transaksi pending (bukan diabaikan, beda provider)",
    provider: "digipos",
    rawText:
      "Transaksi sedang dalam peningkatan koneksi, mohon dicoba lagi nanti. ID Transaksi: DGPS260815123456",
    harusDiabaikan: false,
  },
];

// ============================================================================
// Test Cases - Non-Transaksi (Promo/Info/Top-up Saldo Sendiri)
// ============================================================================

const nonTransaksiTestCases: NonTransaksiTestCase[] = [
  {
    nama: "Promo Digipos - Gebyar Merdeka (WAJIB ditolak, tidak boleh masuk database sama sekali)",
    provider: "digipos",
    rawText:
      "Gebyar Merdeka Digipos 17.8.45! Yuk, kerjar taget transaksinya dan raih hadiah Rp 1.781.945! Penuhi target selama periode 17 Agustus - 17 September 2026.",
    ekspektasiValid: false,
  },
  {
    nama: "Promo - Raih Hadiah Utama",
    provider: "digipos",
    rawText:
      "Raih hadiah utama Rp 10.000.000! Yuk ikut program khusus periode 1-31 Agustus 2026. Syarat dan ketentuan berlaku.",
    ekspektasiValid: false,
  },
  {
    nama: "Promo - Undian Berhadiah",
    provider: "alpines",
    rawText:
      "Undian berhadiah menarik! Semarak meriahkan event spesial. Kode referral: ABC123. Yuk daftar sekarang!",
    ekspektasiValid: false,
  },
  {
    nama: "Top-up Saldo Sendiri - Digipos",
    provider: "digipos",
    rawText:
      "Top up saldo Digipos berhasil. Saldo anda bertambah Rp 500.000. Deposit anda telah diproses.",
    ekspektasiValid: false,
  },
  {
    nama: "Top-up Saldo Sendiri - Alpines",
    provider: "alpines",
    rawText:
      "Isi saldo aplikasi Alpines sukses. Saldo anda ditambahkan Rp 1.000.000. Pengisian saldo dompet anda selesai.",
    ekspektasiValid: false,
  },
  {
    nama: "Info - Maintenance",
    provider: "digipos",
    rawText:
      "Maintenance sistem Digipos pada 15 Agustus 2026 pukul 02:00-04:00 WIB. Mohon maaf atas ketidaknyamanannya.",
    ekspektasiValid: false,
  },
  {
    nama: "Transaksi Valid - Pulsa Alpines (harus lolos)",
    provider: "alpines",
    rawText:
      "Pulsa 50000 berhasil. SN/Ref: PULSA/John/081234567890/50000/REFF:12345. Saldo 1000000 - 52000 = 948000 @15/08 10:30:00",
    ekspektasiValid: true,
  },
  {
    nama: "Transaksi Valid - Paket Data Digipos (harus lolos)",
    provider: "digipos",
    rawText:
      "Paket Data 25GB Telkomsel berhasil. ID Transaksi: DGPS260815123456. Nominal: Rp 150.000. Nomor: 081234567890",
    ekspektasiValid: true,
  },
];

// ============================================================================
// Test Cases - Nominal Dasar Alpines (Fase 2.7)
// ============================================================================

const nominalTestCases: NominalTestCase[] = [
  // PULSA
  {
    nama: "Pulsa Alpines - Isi ulang pulsa Rp 20000",
    provider: "alpines",
    rawText:
      "Pulsa 20000 berhasil. SN/Ref: PULSA/John/081234567890/20000/REFF:12345. Saldo 1000000 - 22000 = 978000 @15/08 10:30:00",
    jenisTransaksi: "pulsa",
    namaProduk: null,
    nominalDasar: 20000,
    sumberDasar: "eksplisit_segmen",
    adminKonter: 2000,
    nominalFinal: 22000,
  },
  {
    nama: "Axis Reguler 30000 AX30...",
    provider: "alpines",
    rawText:
      "Axis Reguler 30000 AX30.083877750811 berhasil. SN/Ref: AXIS/30000/081234567890/REFF:12345. Saldo 1000000 - 32000 = 968000 @15/08 10:30:00",
    jenisTransaksi: "pulsa",
    namaProduk: null,
    nominalDasar: 30000,
    sumberDasar: "eksplisit_header",
    adminKonter: 2000,
    nominalFinal: 32000,
  },
  {
    nama: "Telkomsel BYU 15000 TSBYU15...",
    provider: "alpines",
    rawText:
      "Telkomsel BYU 15000 TSBYU15.085198025507 berhasil. SN/Ref: TELKOMSEL/15000/081234567890/REFF:12345. Saldo 1000000 - 17000 = 983000 @15/08 10:30:00",
    jenisTransaksi: "pulsa",
    namaProduk: null,
    nominalDasar: 15000,
    sumberDasar: "eksplisit_header",
    adminKonter: 2000,
    nominalFinal: 17000,
  },

  // PAKET DATA
  {
    nama: "byU Kaget Rp41800",
    provider: "alpines",
    rawText:
      "byU Kaget 41800 berhasil. SN/Ref: PAKET/41800/081234567890/REFF:12345. Saldo 1000000 - 43800 = 956200 @15/08 10:30:00",
    jenisTransaksi: "paket_data",
    namaProduk: null,
    nominalDasar: 41800,
    sumberDasar: "eksplisit_segmen",
    adminKonter: 2000,
    nominalFinal: 43800,
  },
  {
    nama: "Combo Sakti Rp120000",
    provider: "alpines",
    rawText:
      "Combo Sakti 120000 berhasil. SN/Ref: PAKET/120000/081234567890/REFF:12345. Saldo 1000000 - 122000 = 878000 @15/08 10:30:00",
    jenisTransaksi: "paket_data",
    namaProduk: null,
    nominalDasar: 120000,
    sumberDasar: "eksplisit_segmen",
    adminKonter: 2000,
    nominalFinal: 122000,
  },
  {
    nama: "Super Seru Internet Rp30000",
    provider: "alpines",
    rawText:
      "Super Seru Internet 30000 berhasil. SN/Ref: PAKET/30000/081234567890/REFF:12345. Saldo 1000000 - 32000 = 968000 @15/08 10:30:00",
    jenisTransaksi: "paket_data",
    namaProduk: null,
    nominalDasar: 30000,
    sumberDasar: "eksplisit_segmen",
    adminKonter: 2000,
    nominalFinal: 32000,
  },
  {
    nama: "Voucher AIGO (fallback saldo) - voucher_data_alpines with rounding",
    provider: "alpines",
    rawText:
      "Voucher AIGO 5.5GB 3hr VTR10.0895 berhasil. SN/Ref: VTR10.0895. Saldo 1000000 - 13950 = 986050 @15/08 10:30:00",
    jenisTransaksi: "voucher_data_alpines",
    namaProduk: null,
    nominalDasar: 13950,
    sumberDasar: "fallback_saldo",
    adminKonter: 1050, // 13950 + 1000 = 14950 -> rounded to 15000, admin = 15000 - 13950 = 1050
    nominalFinal: 15000,
  },
  {
    nama: "Voucher Three (fallback saldo) - voucher_data_alpines with rounding",
    provider: "alpines",
    rawText:
      "Voucher Three 5.5GB 3hr VTR10.0895 berhasil. SN/Ref: VTR10.0895. Saldo 1000000 - 15150 = 984850 @15/08 10:30:00",
    jenisTransaksi: "voucher_data_alpines",
    namaProduk: null,
    nominalDasar: 15150,
    sumberDasar: "fallback_saldo",
    adminKonter: 1850, // 15150 + 1000 = 16150 -> rounded to 17000, admin = 17000 - 15150 = 1850
    nominalFinal: 17000,
  },
  {
    nama: "Voucher Three (serial number format, fallback saldo) - voucher_data_alpines with rounding",
    provider: "alpines",
    rawText:
      "Voucher Three 5.5 gb 3 hr *888*Nomor Sn# VTR10.0895 Berhasil. SN/Ref:  :8963 3812 8213 8164. Saldo 347827 - 13150 = 334677 @24/08 11:42:56",
    jenisTransaksi: "voucher_data_alpines",
    namaProduk: null,
    nominalDasar: 13150,
    sumberDasar: "fallback_saldo",
    adminKonter: 1850, // 13150 + 1000 = 14150 -> rounded to 15000, admin = 15000 - 13150 = 1850
    nominalFinal: 15000,
  },

  // PLN
  {
    nama: "PLN senilai 100000",
    provider: "alpines",
    rawText:
      "PLN 100000 berhasil. SN/Ref: PLN/100000/530000000000/REFF:12345. Saldo 1000000 - 105000 = 895000 @15/08 10:30:00",
    jenisTransaksi: "pln",
    namaProduk: null,
    nominalDasar: 100000,
    sumberDasar: "eksplisit_segmen",
    adminKonter: 5000,
    nominalFinal: 105000,
  },
  {
    nama: "PLN senilai 20000",
    provider: "alpines",
    rawText:
      "PLN 20000 berhasil. SN/Ref: PLN/20000/530000000000/REFF:12345. Saldo 1000000 - 24000 = 976000 @15/08 10:30:00",
    jenisTransaksi: "pln",
    namaProduk: null,
    nominalDasar: 20000,
    sumberDasar: "eksplisit_segmen",
    adminKonter: 4000,
    nominalFinal: 24000,
  },
  {
    nama: "TOKEN 20000 PH20...",
    provider: "alpines",
    rawText:
      "TOKEN 20000 PH20.50160790239 berhasil. SN/Ref: PLN/20000/530000000000/REFF:12345. Saldo 1000000 - 24000 = 976000 @15/08 10:30:00",
    jenisTransaksi: "pln",
    namaProduk: null,
    nominalDasar: 20000,
    sumberDasar: "eksplisit_header",
    adminKonter: 4000,
    nominalFinal: 24000,
  },

  // E-WALLET
  {
    nama: "DANA format 1 (nominal_dasar 50000, <=99rb)",
    provider: "alpines",
    rawText:
      "DANA TOPUP/MXX INDXXXXXX/50000/081234567890/REFF:12345 berhasil. Saldo 1000000 - 53000 = 947000 @15/08 10:30:00",
    jenisTransaksi: "ewallet",
    namaProduk: "DANA",
    nominalDasar: 50000,
    sumberDasar: "eksplisit_segmen",
    adminKonter: 3000,
    nominalFinal: 53000,
  },
  {
    nama: "DANA format 2 (NOMINAL:200000, >99rb)",
    provider: "alpines",
    rawText:
      "DANA 200000 berhasil. NOMINAL:200000. SN/Ref: DANA/John/081234567890/REFF:12345. Saldo 1000000 - 205000 = 795000 @15/08 10:30:00",
    jenisTransaksi: "ewallet",
    namaProduk: "DANA",
    nominalDasar: 200000,
    sumberDasar: "eksplisit_nominal",
    adminKonter: 5000,
    nominalFinal: 205000,
  },
  {
    nama: "DANA 99000 (batas admin 3000)",
    provider: "alpines",
    rawText:
      "DANA TOPUP/MXX INDXXXXXX/99000/081234567890/REFF:12345 berhasil. Saldo 1000000 - 102000 = 898000 @15/08 10:30:00",
    jenisTransaksi: "ewallet",
    namaProduk: "DANA",
    nominalDasar: 99000,
    sumberDasar: "eksplisit_segmen",
    adminKonter: 3000,
    nominalFinal: 102000,
  },
  {
    nama: "DANA 100000 (batas admin 5000)",
    provider: "alpines",
    rawText:
      "DANA TOPUP/MXX INDXXXXXX/100000/081234567890/REFF:12345 berhasil. Saldo 1000000 - 105000 = 895000 @15/08 10:30:00",
    jenisTransaksi: "ewallet",
    namaProduk: "DANA",
    nominalDasar: 100000,
    sumberDasar: "eksplisit_segmen",
    adminKonter: 5000,
    nominalFinal: 105000,
  },
  {
    nama: "GoPay (nominal_dasar 100000, e-wallet selain DANA flat)",
    provider: "alpines",
    rawText:
      "GOPAY/Jasmisaputra/100000/081372331339/REFF:12345 berhasil. Saldo 1000000 - 105000 = 895000 @15/08 10:30:00",
    jenisTransaksi: "ewallet",
    namaProduk: "GoPay",
    nominalDasar: 100000,
    sumberDasar: "eksplisit_segmen",
    adminKonter: 5000,
    nominalFinal: 105000,
  },

  // GAME TOP-UP (TIDAK ada admin, tetap nominal_dasar apa adanya dari fallback saldo)
  {
    nama: "Free Fire (fallback saldo, nominal_dasar = 14450)",
    provider: "alpines",
    rawText:
      "Free Fire 14450 berhasil. SN/Ref: FF/14450/123456789/REFF:12345. Saldo 1000000 - 14450 = 985550 @15/08 10:30:00",
    jenisTransaksi: "game_topup",
    namaProduk: null,
    nominalDasar: 14450,
    sumberDasar: "eksplisit_segmen",
    adminKonter: 0,
    nominalFinal: 14450,
  },

  // DIGIPOS TEST CASES
  {
    nama: "Digipos Pulsa Rp 20000",
    provider: "digipos",
    rawText:
      "Isi ulang pulsa Rp 20000 untuk no pelanggan 628123456789 telah berhasil dengan SN 12345 dan ID Transaksi DGPS260815123456",
    jenisTransaksi: "pulsa",
    namaProduk: null,
    nominalDasar: 20000,
    sumberDasar: undefined,
    adminKonter: 2000,
    nominalFinal: 22000,
  },
  {
    nama: "Digipos Paket Data 25GB Telkomsel Rp 150000",
    provider: "digipos",
    rawText:
      "Transaksi pengisian paket data 25GB Telkomsel pada 15 Agustus 2026 10:30:00 senilai Rp150000 telah berhasil. MSISDN: 081234567890. ID Transaksi: DGPS260815123456",
    jenisTransaksi: "paket_data",
    namaProduk: "25GB Telkomsel",
    nominalDasar: 150000,
    sumberDasar: undefined,
    adminKonter: 2000,
    nominalFinal: 152000,
  },
  {
    nama: "Digipos PLN senilai 100000",
    provider: "digipos",
    rawText:
      "Anda telah melakukan pembayaran PLN senilai 100000 pada 2026-08-15 10:30:00 Biaya admin 5000. ID Transaksi DGPS260815123456 Saldo LinkAja 500000. Token PLN Prabayar Anda 123456789012. Nometer 530000000000 atas nama John Doe. 10 kWh",
    jenisTransaksi: "pln",
    namaProduk: null,
    nominalDasar: 100000,
    sumberDasar: undefined,
    adminKonter: 5000,
    nominalFinal: 105000,
  },
  // Talkmania (paket_nelpon) test cases
  {
    nama: "Digipos Talkmania Sakti Bulanan Rp7999",
    provider: "digipos",
    rawText:
      "Isi ulang paket Talkmania Sakti Bulanan 6285272325772 pd 25/08/2026 14:56:49 berhasil. Voucher senilai Rp7999. Nomor seri 04254600000279933186. Cek sisa stock di *181*1*5*2*PIN#.",
    jenisTransaksi: "paket_nelpon",
    namaProduk: "Talkmania Sakti Bulanan",
    nominalDasar: 7999,
    sumberDasar: undefined,
    adminKonter: 2001, // 7999 -> 8000 + 2000 = 10000, margin = 2001
    nominalFinal: 10000,
  },
  {
    nama: "Digipos Talkmania Sakti Bulanan Rp17999",
    provider: "digipos",
    rawText:
      "Isi ulang paket Talkmania Sakti Bulanan 6285272325772 pd 25/08/2026 14:56:49 berhasil. Voucher senilai Rp17999. Nomor seri 04254600000279933186. Cek sisa stock di *181*1*5*2*PIN#.",
    jenisTransaksi: "paket_nelpon",
    namaProduk: "Talkmania Sakti Bulanan",
    nominalDasar: 17999,
    sumberDasar: undefined,
    adminKonter: 2001, // 17999 -> 18000 + 2000 = 20000, margin = 2001
    nominalFinal: 20000,
  },
  {
    nama: "Digipos Combo Sakti (paket_data, NOT Talkmania)",
    provider: "digipos",
    rawText:
      "Isi ulang paket Combo Sakti 6281266562888 pd 25/08/2026 14:56:49 berhasil. Voucher senilai Rp15000. Nomor seri 04254600000279933186. Cek sisa stock di *181*1*5*2*PIN#.",
    jenisTransaksi: "paket_data",
    namaProduk: "Combo Sakti",
    nominalDasar: 15000,
    sumberDasar: undefined,
    adminKonter: 2000,
    nominalFinal: 17000,
  },

  // BUG 1 FIX: GoPay/ShopeePay with REF:/Reff: variations
  {
    nama: "GoPay REF: (single F, uppercase) - nominal eksplisit 50000",
    provider: "alpines",
    rawText:
      "SALDO GOPAY GO50.08218444166 Berhasil. SN/Ref: GOPAY/Rxx Sxxxxx/50000/08218444166/REF:MB26080323082647. Saldo 115.377 - 51.950 = 63.427 @26/08 20:47:37",
    jenisTransaksi: "ewallet",
    namaProduk: "GoPay",
    nominalDasar: 50000,
    sumberDasar: "eksplisit_segmen",
    adminKonter: 5000,
    nominalFinal: 55000,
  },
  {
    nama: "ShopeePay Reff: (lowercase, double f) - nominal eksplisit 50000",
    provider: "alpines",
    rawText:
      "SHOPEE  ADMIN 500 SHO50.085194309746 Berhasil. SN/Ref: SHOPEEPAY/adamanggara483/50000/Reff:1787757144936800526 . Saldo 63.427 - 50.650 = 12.777 @26/08 22:12:29",
    jenisTransaksi: "ewallet",
    namaProduk: "ShopeePay",
    nominalDasar: 50000,
    sumberDasar: "eksplisit_segmen",
    adminKonter: 5000,
    nominalFinal: 55000,
  },
  {
    nama: "GoPay REFF: (standard, double F uppercase) - nominal eksplisit 100000",
    provider: "alpines",
    rawText:
      "GOPAY/Jasmisaputra/100000/081372331339/REFF:0420260814154213iJ5AJAncKMID berhasil. Saldo 1000000 - 105000 = 895000 @15/08 10:30:00",
    jenisTransaksi: "ewallet",
    namaProduk: "GoPay",
    nominalDasar: 100000,
    sumberDasar: "eksplisit_segmen",
    adminKonter: 5000,
    nominalFinal: 105000,
  },

  // BUG 3: Bayar Tagihan Telkom/Indihome via Alpines
  {
    nama: "Bayar Tagihan Telkom - nominal 200000, admin telkom 2500",
    provider: "alpines",
    rawText:
      "BAYAR TAGIHAN TELKOM 1234567890 Berhasil. SN/Ref: Budi Santoso /Periode:202408/Rp.200000/205000A/Adm2500/RpTag200000/200000,. Saldo 1000000 - 205000 = 795000 @15/08 10:30:00",
    jenisTransaksi: "tagihan",
    namaProduk: "Tagihan Indihome/Telkom",
    nominalDasar: 200000,
    sumberDasar: "eksplisit_tagihan",
    adminKonter: 5000, // tagihan > 50rb -> admin 5000
    nominalFinal: 205000,
  },
  {
    nama: "Bayar Tagihan Indihome - nominal 150000, admin telkom 2500",
    provider: "alpines",
    rawText:
      "BAYAR TAGIHAN TELKOM 9876543210 Berhasil. SN/Ref: Siti Rahayu /Periode:202407/Rp.150000/155000B/Adm2500/RpTag150000/150000,. Saldo 500000 - 155000 = 345000 @20/07 14:22:15",
    jenisTransaksi: "tagihan",
    namaProduk: "Tagihan Indihome/Telkom",
    nominalDasar: 150000,
    sumberDasar: "eksplisit_tagihan",
    adminKonter: 5000, // tagihan > 50rb -> admin 5000
    nominalFinal: 155000,
  },
  {
    nama: "Bayar Tagihan Telkom - nominal 30000 (<=50rb), admin telkom 2500",
    provider: "alpines",
    rawText:
      "BAYAR TAGIHAN TELKOM 5555555555 Berhasil. SN/Ref: Ahmad /Periode:202406/Rp.30000/34000C/Adm2500/RpTag30000/30000,. Saldo 200000 - 34000 = 166000 @10/06 09:15:30",
    jenisTransaksi: "tagihan",
    namaProduk: "Tagihan Indihome/Telkom",
    nominalDasar: 30000,
    sumberDasar: "eksplisit_tagihan",
    adminKonter: 4000, // tagihan <= 50rb -> admin 4000
    nominalFinal: 34000,
  },
];

// ============================================================================
// Test Runner
// ============================================================================

function runPendingTests() {
  console.log("\n========== TEST: Alpines Pending Filter ==========");
  let passed = 0;
  let failed = 0;

  for (const tc of pendingTestCases) {
    const result = apakahNotifikasiPendingAlpines(tc.rawText, tc.provider);
    const success = result === tc.harusDiabaikan;

    if (success) {
      console.log(`✅ PASS: ${tc.nama}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${tc.nama}`);
      console.log(`   Expected: ${tc.harusDiabaikan}, Got: ${result}`);
      console.log(`   Text: ${tc.rawText.substring(0, 80)}...`);
      failed++;
    }
  }

  console.log(`\nPending Tests: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

function runNonTransaksiTests() {
  console.log(
    "\n========== TEST: Non-Transaksi Filter (Promo/Info/Top-up) ==========",
  );
  let passed = 0;
  let failed = 0;

  for (const tc of nonTransaksiTestCases) {
    const { teksTanpaSaldo } = pisahkanSaldoAplikasi(tc.rawText);
    const result = apakahTransaksiPelanggan(teksTanpaSaldo);
    const success = result.valid === tc.ekspektasiValid;

    if (success) {
      console.log(`✅ PASS: ${tc.nama}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${tc.nama}`);
      console.log(
        `   Expected valid: ${tc.ekspektasiValid}, Got: ${result.valid}`,
      );
      console.log(`   Alasan: ${result.alasan}`);
      console.log(
        `   Text (tanpa saldo): ${teksTanpaSaldo.substring(0, 80)}...`,
      );
      failed++;
    }
  }

  console.log(`\nNon-Transaksi Tests: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

function runNominalTests() {
  console.log(
    "\n========== TEST: Nominal Dasar + Admin Konter (Fase 2.7) ==========",
  );
  let passed = 0;
  let failed = 0;

  for (const tc of nominalTestCases) {
    let result;
    if (tc.provider === "alpines") {
      result = parseNotifikasi({ provider: "alpines", rawText: tc.rawText });
    } else {
      result = parseNotifikasi({ provider: "digipos", rawText: tc.rawText });
    }

    // Test nominalDasar
    const nominalDasarMatch =
      result.detail_tambahan?.nominal_dasar === tc.nominalDasar;
    // Test sumberDasar
    const sumberDasarMatch =
      result.detail_tambahan?.sumber_nominal_dasar === tc.sumberDasar;
    // Test adminKonter
    const adminKonterMatch =
      result.detail_tambahan?.admin_konter === tc.adminKonter;
    // Test nominalFinal
    const nominalFinalMatch = result.nominal === tc.nominalFinal;

    const success =
      nominalDasarMatch &&
      sumberDasarMatch &&
      adminKonterMatch &&
      nominalFinalMatch;

    if (success) {
      console.log(`✅ PASS: ${tc.nama}`);
      console.log(
        `   nominalDasar: ${result.detail_tambahan?.nominal_dasar}, sumber: ${result.detail_tambahan?.sumber_nominal_dasar}, admin: ${result.detail_tambahan?.admin_konter}, final: ${result.nominal}`,
      );
      passed++;
    } else {
      console.log(`❌ FAIL: ${tc.nama}`);
      console.log(
        `   Expected: nominalDasar=${tc.nominalDasar}, sumber=${tc.sumberDasar}, admin=${tc.adminKonter}, final=${tc.nominalFinal}`,
      );
      console.log(
        `   Got: nominalDasar=${result.detail_tambahan?.nominal_dasar}, sumber=${result.detail_tambahan?.sumber_nominal_dasar}, admin=${result.detail_tambahan?.admin_konter}, final=${result.nominal}`,
      );
      console.log(
        `   jenisTransaksi: ${result.jenis_transaksi}, namaProduk: ${result.nama_produk}`,
      );
      failed++;
    }
  }

  console.log(`\nNominal Tests: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

function runAdminKonterUnitTests() {
  console.log("\n========== TEST: Admin Konter Unit Tests ==========");
  let passed = 0;
  let failed = 0;

  const unitTests = [
    {
      nama: "DANA <= 100rb",
      nominal: 50000,
      jenis: "ewallet",
      produk: "DANA",
      expected: 3000,
    },
    {
      nama: "DANA > 100rb",
      nominal: 200000,
      jenis: "ewallet",
      produk: "DANA",
      expected: 5000,
    },
    {
      nama: "GoPay (non-DANA)",
      nominal: 100000,
      jenis: "ewallet",
      produk: "GoPay",
      expected: 5000,
    },
    {
      nama: "PLN <= 50rb",
      nominal: 20000,
      jenis: "pln",
      produk: null,
      expected: 4000,
    },
    {
      nama: "PLN > 50rb",
      nominal: 100000,
      jenis: "pln",
      produk: null,
      expected: 5000,
    },
    {
      nama: "Pulsa",
      nominal: 15000,
      jenis: "pulsa",
      produk: null,
      expected: 2000,
    },
    {
      nama: "Paket Data",
      nominal: 30000,
      jenis: "paket_data",
      produk: null,
      expected: 2000,
    },
    {
      nama: "Tagihan <= 50rb",
      nominal: 20000,
      jenis: "tagihan",
      produk: null,
      expected: 4000,
    },
    {
      nama: "Tagihan > 50rb",
      nominal: 100000,
      jenis: "tagihan",
      produk: null,
      expected: 5000,
    },
    {
      nama: "Game Topup (no rule)",
      nominal: 14450,
      jenis: "game_topup",
      produk: null,
      expected: 0,
    },
    {
      nama: "Voucher Fisik (no rule)",
      nominal: 11950,
      jenis: "voucher_fisik",
      produk: null,
      expected: 0,
    },
    {
      nama: "Paket Nelpon (Talkmania) - round nominal first then add admin",
      nominal: 10000,
      jenis: "paket_nelpon",
      produk: null,
      expected: 2000, // 10000 rounded to 10000 + 2000 = 12000, admin = 2000
    },
    {
      nama: "Paket Nelpon (Talkmania) - 17999 -> 18000 + 2000 = 20000",
      nominal: 17999,
      jenis: "paket_nelpon",
      produk: null,
      expected: 2001, // 17999 rounded to 18000 + 2000 = 20000, admin = 20000 - 17999 = 2001
    },
    {
      nama: "Paket Nelpon (Talkmania) - 7999 -> 8000 + 2000 = 10000",
      nominal: 7999,
      jenis: "paket_nelpon",
      produk: null,
      expected: 2001, // 7999 rounded to 8000 + 2000 = 10000, admin = 10000 - 7999 = 2001
    },
  ];

  for (const tc of unitTests) {
    const result = terapkanAdminKonter(tc.nominal, tc.jenis, tc.produk);
    const success = result.adminKonter === tc.expected;

    if (success) {
      console.log(
        `✅ PASS: ${tc.nama} -> admin=${result.adminKonter}, final=${result.nominalFinal}`,
      );
      passed++;
    } else {
      console.log(`❌ FAIL: ${tc.nama}`);
      console.log(
        `   Expected admin: ${tc.expected}, Got: ${result.adminKonter}`,
      );
      failed++;
    }
  }

  console.log(`\nAdmin Konter Unit Tests: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

function runEkstraksiNominalDasarTests() {
  console.log(
    "\n========== TEST: Ekstraksi Nominal Dasar Alpines (Unit) ==========",
  );
  let passed = 0;
  let failed = 0;

  const unitTests = [
    {
      nama: "NOMINAL: eksplisit",
      rawText:
        "DANA 200000 berhasil. NOMINAL:200000. Saldo 1000000 - 205000 = 795000 @15/08 10:30:00",
      potonganSaldo: 205000,
      expectedNominal: 200000,
      expectedSumber: "eksplisit_nominal",
    },
    {
      nama: "Angka sebelum kode (Telkomsel BYU)",
      rawText:
        "Telkomsel BYU 15000 TSBYU15.085198025507 berhasil. Saldo 1000000 - 17000 = 983000 @15/08 10:30:00",
      potonganSaldo: 17000,
      expectedNominal: 15000,
      expectedSumber: "eksplisit_header",
    },
    {
      nama: "Angka sebelum kode (Axis Reguler)",
      rawText:
        "Axis Reguler 30000 AX30.083877750811 berhasil. Saldo 1000000 - 32000 = 968000 @15/08 10:30:00",
      potonganSaldo: 32000,
      expectedNominal: 30000,
      expectedSumber: "eksplisit_header",
    },
    {
      nama: "TOKEN di header",
      rawText:
        "TOKEN 20000 PH20.50160790239 berhasil. Saldo 1000000 - 24000 = 976000 @15/08 10:30:00",
      potonganSaldo: 24000,
      expectedNominal: 20000,
      expectedSumber: "eksplisit_header",
    },
    {
      nama: "Segmen SN/Ref (DANA)",
      rawText:
        "DANA TOPUP/MXX INDXXXXXX/50000/081234567890/REFF:12345 berhasil. Saldo 1000000 - 53000 = 947000 @15/08 10:30:00",
      potonganSaldo: 53000,
      expectedNominal: 50000,
      expectedSumber: "eksplisit_segmen",
    },
    {
      nama: "Segmen SN/Ref (GoPay)",
      rawText:
        "GOPAY/Jasmisaputra/100000/081372331339/REFF:12345 berhasil. Saldo 1000000 - 105000 = 895000 @15/08 10:30:00",
      potonganSaldo: 105000,
      expectedNominal: 100000,
      expectedSumber: "eksplisit_segmen",
    },
    {
      nama: "Fallback saldo (Voucher AIGO)",
      rawText:
        "Voucher AIGO 5.5GB 3hr VTR10.0895 berhasil. SN/Ref: VTR10.0895. Saldo 1000000 - 13950 = 986050 @15/08 10:30:00",
      potonganSaldo: 13950,
      expectedNominal: 13950,
      expectedSumber: "fallback_saldo",
    },
  ];

  for (const tc of unitTests) {
    const result = ekstraksiNominalDasarAlpines(tc.rawText, tc.potonganSaldo);
    const success =
      result.nominalDasar === tc.expectedNominal &&
      result.sumberDasar === tc.expectedSumber;

    if (success) {
      console.log(
        `✅ PASS: ${tc.nama} -> ${result.nominalDasar} (${result.sumberDasar})`,
      );
      passed++;
    } else {
      console.log(`❌ FAIL: ${tc.nama}`);
      console.log(
        `   Expected: ${tc.expectedNominal} (${tc.expectedSumber}), Got: ${result.nominalDasar} (${result.sumberDasar})`,
      );
      failed++;
    }
  }

  console.log(
    `\nEkstraksi Nominal Dasar Tests: ${passed} passed, ${failed} failed`,
  );
  return { passed, failed };
}

// ============================================================================
// Main
// ============================================================================

function main() {
  console.log("🧪 Running Local Parser Tests...\n");

  const pendingResults = runPendingTests();
  const nonTransaksiResults = runNonTransaksiTests();
  const nominalResults = runNominalTests();
  const adminKonterResults = runAdminKonterUnitTests();
  const ekstraksiResults = runEkstraksiNominalDasarTests();

  const totalPassed =
    pendingResults.passed +
    nonTransaksiResults.passed +
    nominalResults.passed +
    adminKonterResults.passed +
    ekstraksiResults.passed;
  const totalFailed =
    pendingResults.failed +
    nonTransaksiResults.failed +
    nominalResults.failed +
    adminKonterResults.failed +
    ekstraksiResults.failed;

  console.log("\n========== SUMMARY ==========");
  console.log(`Total: ${totalPassed} passed, ${totalFailed} failed`);

  if (totalFailed > 0) {
    console.log("\n❌ SOME TESTS FAILED");
    process.exit(1);
  } else {
    console.log("\n✅ ALL TESTS PASSED");
    process.exit(0);
  }
}

main();
