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

// ============================================================================
// Main
// ============================================================================

function main() {
  console.log("🧪 Running Local Parser Tests...\n");

  const pendingResults = runPendingTests();
  const nonTransaksiResults = runNonTransaksiTests();

  const totalPassed = pendingResults.passed + nonTransaksiResults.passed;
  const totalFailed = pendingResults.failed + nonTransaksiResults.failed;

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
