/**
 * Test runner for parser Fase 2.2 — 7 test cases from SRS Bagian 7.
 * Run with: npx tsx scripts/test-parser.ts
 */

import { parseNotifikasi } from "../src/lib/parser";

interface TestCase {
  name: string;
  provider: string;
  text: string;
  expected: {
    jenis_transaksi: string;
    nominal: number | null;
    nomor_tujuan: string | null;
    provider_seluler?: string | null;
    nama_produk?: string | null;
    nama_pemilik?: string | null;
    status: "sukses" | "gagal" | "pending";
    perlu_review: boolean;
    detail_tambahan_keys?: string[];
  };
}

const TEST_CASES: TestCase[] = [
  {
    name: "7.1 Digipos — Pulsa (format lengkap)",
    provider: "digipos",
    text: "Isi ulang pulsa Rp 20000 untuk no pelanggan 6285176740026 telah berhasil dengan SN 04224600001707226406 dan ID Transaksi DGPS260726164455775705549",
    expected: {
      jenis_transaksi: "pulsa",
      nominal: 20000,
      nomor_tujuan: "6285176740026",
      status: "sukses",
      perlu_review: false,
      detail_tambahan_keys: ["sn", "id_transaksi"],
    },
  },
  {
    name: "7.2 Digipos — Pulsa (tanpa nominal)",
    provider: "digipos",
    text: "Isi ulang pulsa untuk no. 6285176740026 telah berhasil dengan SN: 04224600001707226406 pada 14/08/2026 09:44:37",
    expected: {
      jenis_transaksi: "pulsa",
      nominal: null,
      nomor_tujuan: "6285176740026",
      status: "sukses",
      perlu_review: true,
    },
  },
  {
    name: "7.3 Digipos — Paket Data",
    provider: "digipos",
    text: "Transaksi pengisian paket data byU Kaget 11 GB 28 Hari 28 Hari pada 12 August 2026 10:17:29 senilai Rp41800 telah berhasil. MSISDN: 6285194309031. ID Transaksi: DGPS260812221726516954578",
    expected: {
      jenis_transaksi: "paket_data",
      nominal: 41800,
      nomor_tujuan: "6285194309031",
      nama_produk: "byU Kaget 11 GB 28 Hari 28 Hari",
      status: "sukses",
      perlu_review: false,
      detail_tambahan_keys: ["id_transaksi"],
    },
  },
  {
    name: "7.4 Alpines — Paket Data (Voucher)",
    provider: "alpines",
    text: "VOUCHER AIGO 5.5 gb 3 hari 838nomor voucher#VA5.0838 Berhasil. SN/Ref: :3170 0838 8279 5759. Saldo 309.523 - 11950 = 297.573 @15/08 20:44:39",
    expected: {
      jenis_transaksi: "paket_data",
      nominal: 11950,
      nomor_tujuan: null,
      nama_produk: "AIGO 5.5 gb 3 hari",
      status: "sukses",
      perlu_review: true,
      detail_tambahan_keys: ["sn"],
    },
  },
  {
    name: "7.5 Alpines — E-wallet DANA (format 1)",
    provider: "alpines",
    text: "Saldo DANA50.081261592333 Berhasil. SN/Ref: DANA TOPUP/MXX INDXXXXXX/50000/081261592333/REFF:2026072610121481030100166970654515631. Saldo 998.218 - 50.650 = 947.568 @26/07 21:03:16",
    expected: {
      jenis_transaksi: "ewallet",
      nominal: 50650,
      nomor_tujuan: "081261592333",
      nama_produk: "DANA",
      nama_pemilik: null,
      status: "sukses",
      perlu_review: false,
      detail_tambahan_keys: ["sn_ref_raw", "id_transaksi"],
    },
  },
  {
    name: "7.6 Alpines — E-wallet DANA (format 2, dengan nama)",
    provider: "alpines",
    text: "Saldo DANA.200.081267746287 Berhasil. SN/Ref: NAMA:DNID-AVRXXXX WIJXXXXXX/NOMINAL:200000/IDT:2026081510121481030100166963767458397. Saldo 731-423 - 200.850 = 530.573 @15/08 13:17:49",
    expected: {
      jenis_transaksi: "ewallet",
      nominal: 200000,
      nomor_tujuan: "081267746287",
      nama_produk: "DANA",
      nama_pemilik: "DNID-AVRXXXX WIJXXXXXX",
      status: "sukses",
      perlu_review: false,
      detail_tambahan_keys: ["id_transaksi", "idt"],
    },
  },
  {
    name: "7.7 Alpines — E-wallet GoPay",
    provider: "alpines",
    text: "SALDO GOPAY GO100.081372331339 Berhasil. SN/Ref: GOPAY/Jasmisaputra/100000/081372331339/REFF:0420260814154213iJ5AJAncKMID. Saldo 231.173 - 102.150 = 129.023 @14/08 22:42:31",
    expected: {
      jenis_transaksi: "ewallet",
      nominal: 100000,
      nomor_tujuan: "081372331339",
      nama_produk: "GoPay",
      nama_pemilik: "Jasmisaputra",
      status: "sukses",
      perlu_review: false,
      detail_tambahan_keys: ["sn_ref_raw", "reff"],
    },
  },
];

let passed = 0;
let failed = 0;

console.log("=".repeat(70));
console.log("PARSER TEST — Fase 2.2 (7 test cases from SRS Bagian 7)");
console.log("=".repeat(70));

for (const tc of TEST_CASES) {
  const result = parseNotifikasi({ provider: tc.provider, rawText: tc.text });
  const errors: string[] = [];

  // Check expected fields
  if (result.jenis_transaksi !== tc.expected.jenis_transaksi) {
    errors.push(
      `jenis_transaksi: got "${result.jenis_transaksi}", expected "${tc.expected.jenis_transaksi}"`,
    );
  }
  if (result.nominal !== tc.expected.nominal) {
    errors.push(
      `nominal: got ${result.nominal}, expected ${tc.expected.nominal}`,
    );
  }
  if (result.nomor_tujuan !== tc.expected.nomor_tujuan) {
    errors.push(
      `nomor_tujuan: got "${result.nomor_tujuan}", expected "${tc.expected.nomor_tujuan}"`,
    );
  }
  if (result.status !== tc.expected.status) {
    errors.push(
      `status: got "${result.status}", expected "${tc.expected.status}"`,
    );
  }
  if (result.perlu_review !== tc.expected.perlu_review) {
    errors.push(
      `perlu_review: got ${result.perlu_review}, expected ${tc.expected.perlu_review}`,
    );
  }
  if (tc.expected.provider_seluler !== undefined && result.provider_seluler !== tc.expected.provider_seluler) {
    errors.push(
      `provider_seluler: got "${result.provider_seluler}", expected "${tc.expected.provider_seluler}"`,
    );
  }
  if (tc.expected.nama_produk !== undefined && result.nama_produk !== tc.expected.nama_produk) {
    errors.push(
      `nama_produk: got "${result.nama_produk}", expected "${tc.expected.nama_produk}"`,
    );
  }
  if (tc.expected.nama_pemilik !== undefined && result.nama_pemilik !== tc.expected.nama_pemilik) {
    errors.push(
      `nama_pemilik: got "${result.nama_pemilik}", expected "${tc.expected.nama_pemilik}"`,
    );
  }
  if (tc.expected.detail_tambahan_keys) {
    for (const key of tc.expected.detail_tambahan_keys) {
      if (!result.detail_tambahan || !(key in result.detail_tambahan)) {
        errors.push(`detail_tambahan.${key}: missing`);
      }
    }
  }

  if (errors.length === 0) {
    console.log(`\n✅ PASS: ${tc.name}`);
    console.log(`   jenis=${result.jenis_transaksi} nominal=${result.nominal} nomor=${result.nomor_tujuan} review=${result.perlu_review}`);
    passed++;
  } else {
    console.log(`\n❌ FAIL: ${tc.name}`);
    for (const err of errors) {
      console.log(`   - ${err}`);
    }
    failed++;
  }
}

console.log("\n" + "=".repeat(70));
console.log(`Results: ${passed} passed, ${failed} failed out of ${TEST_CASES.length} tests`);
console.log("=".repeat(70));

process.exit(failed > 0 ? 1 : 0);