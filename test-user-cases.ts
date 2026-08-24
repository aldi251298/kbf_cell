/**
 * Test script for user's 3 specific notification formats
 * Run with: npx ts-node test-user-cases.ts
 */

import { parseNotifikasi } from "./src/lib/parser/index";

// ============================================================================
// Test Cases from User Request
// ============================================================================

interface UserTestCase {
  nama: string;
  provider: "alpines" | "digipos";
  rawText: string;
  expected: {
    jenisTransaksi: string;
    namaProduk: string;
    nominalDasar: number;
    nominalFinal: number;
    adminKonter: number;
    kategori?: string; // for PLN case
  };
}

const userTestCases: UserTestCase[] = [
  {
    nama: "Test 1: Voucher Three 5.5 gb 3 hr",
    provider: "alpines",
    rawText: "Voucher Three 5.5 gb 3 hr   *888*Nomor Sn# VTR10.0895 Berhasil. SN/Ref:  :1583 0278 6596 2336. Saldo 422.877 - 13150 = 409.727 @23/08 20:47:15",
    expected: {
      jenisTransaksi: "paket_data",
      namaProduk: "Three 5.5 gb 3 hr",
      nominalDasar: 13150,
      nominalFinal: 15150, // 13150 + 2000 admin
      adminKonter: 2000,
    },
  },
  {
    nama: "Test 2: VOUCHER AIGO 5.5 gb 3 hari",
    provider: "alpines",
    rawText: "VOUCHER AIGO 5.5 gb 3 hari    *838*nomor voucher# VA5.0838 Berhasil. SN/Ref:  :5213 9971 1934 0958. Saldo 20.327 - 11950 = 8.377 @22/08 20:24:03",
    expected: {
      jenisTransaksi: "paket_data",
      namaProduk: "AIGO 5.5 gb 3 hari",
      nominalDasar: 11950,
      nominalFinal: 13950, // 11950 + 2000 admin
      adminKonter: 2000,
    },
  },
  {
    nama: "Test 3: TOKEN 20000 PH20.86019352730 (PLN)",
    provider: "alpines",
    rawText: "TOKEN 20000 PH20.86019352730 Berhasil. SN/Ref: 1209-3627-8090-3458-7200/YESSI-TRIANA/R1M/900/13,5. Saldo 223.377 - 22.450 = 200.927 @24/08 18:11:59",
    expected: {
      jenisTransaksi: "pln",
      namaProduk: "PLN", // or whatever the parser extracts
      nominalDasar: 20000,
      nominalFinal: 24000, // 20000 + 4000 admin (PLN <= 50rb = 4000)
      adminKonter: 4000,
      kategori: "pln",
    },
  },
  {
    nama: "Test 4: VOUCHER AIGO with serial SN/Ref and saldo with dots",
    provider: "alpines",
    rawText: "VOUCHER AIGO 5.5 gb 3 hari *838*nomor voucher#PH52.8618155496 Berhasil. SN/Ref: :8777 4387 5163 9348. Saldo 191.884 - 101.000 = 90.884 @25/08 03:32:31",
    expected: {
      jenisTransaksi: "paket_data",
      namaProduk: "AIGO 5.5 gb 3 hari",
      nominalDasar: 101000,
      nominalFinal: 103000,
      adminKonter: 2000,
    },
  },
];

// ============================================================================
// Test Runner
// ============================================================================

function runUserTests() {
  console.log("🧪 Running User's 3 Test Cases...\n");
  let passed = 0;
  let failed = 0;

  for (const tc of userTestCases) {
    console.log(`\n--- ${tc.nama} ---`);
    console.log(`Input: ${tc.rawText.substring(0, 100)}...`);

    const result = parseNotifikasi({ provider: tc.provider, rawText: tc.rawText });

    console.log(`\nParsed Result:`);
    console.log(`  jenis_transaksi: ${result.jenis_transaksi}`);
    console.log(`  nama_produk: ${result.nama_produk}`);
    console.log(`  nominal: ${result.nominal}`);
    console.log(`  nominal_dasar: ${result.detail_tambahan?.nominal_dasar}`);
    console.log(`  sumber_nominal_dasar: ${result.detail_tambahan?.sumber_nominal_dasar}`);
    console.log(`  admin_konter: ${result.detail_tambahan?.admin_konter}`);
    console.log(`  status: ${result.status}`);
    console.log(`  perlu_review: ${result.perlu_review}`);
    if (result.detail_tambahan?.alasan_review) {
      console.log(`  alasan_review: ${result.detail_tambahan.alasan_review}`);
    }

    // Validate
    const jenisMatch = result.jenis_transaksi === tc.expected.jenisTransaksi;
    const namaProdukMatch = result.nama_produk === tc.expected.namaProduk;
    const nominalDasarMatch = result.detail_tambahan?.nominal_dasar === tc.expected.nominalDasar;
    const nominalFinalMatch = result.nominal === tc.expected.nominalFinal;
    const adminKonterMatch = result.detail_tambahan?.admin_konter === tc.expected.adminKonter;

    const success = jenisMatch && namaProdukMatch && nominalDasarMatch && nominalFinalMatch && adminKonterMatch;

    console.log(`\nValidation:`);
    console.log(`  jenis_transaksi: ${jenisMatch ? "✅" : "❌"} (expected: ${tc.expected.jenisTransaksi}, got: ${result.jenis_transaksi})`);
    console.log(`  nama_produk: ${namaProdukMatch ? "✅" : "❌"} (expected: "${tc.expected.namaProduk}", got: "${result.nama_produk}")`);
    console.log(`  nominal_dasar: ${nominalDasarMatch ? "✅" : "❌"} (expected: ${tc.expected.nominalDasar}, got: ${result.detail_tambahan?.nominal_dasar})`);
    console.log(`  nominal_final: ${nominalFinalMatch ? "✅" : "❌"} (expected: ${tc.expected.nominalFinal}, got: ${result.nominal})`);
    console.log(`  admin_konter: ${adminKonterMatch ? "✅" : "❌"} (expected: ${tc.expected.adminKonter}, got: ${result.detail_tambahan?.admin_konter})`);

    if (success) {
      console.log(`\n✅ PASS: ${tc.nama}`);
      passed++;
    } else {
      console.log(`\n❌ FAIL: ${tc.nama}`);
      failed++;
    }
  }

  console.log("\n========== SUMMARY ==========");
  console.log(`Total: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log("\n❌ SOME TESTS FAILED");
    process.exit(1);
  } else {
    console.log("\n✅ ALL TESTS PASSED");
    process.exit(0);
  }
}

runUserTests();