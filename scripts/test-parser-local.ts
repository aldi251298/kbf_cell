// scripts/test-parser-local.ts
//
// Script test parser MURNI LOKAL — tidak ada koneksi HTTP/database sama sekali.
// Hanya memanggil fungsi parseNotifikasi() langsung dan membandingkan hasilnya.
//
// PENTING: seluruh raw text di bawah ini adalah notifikasi ASLI yang sudah dikonfirmasi
// langsung dari pemilik konter, BUKAN notifikasi karangan/template buatan sendiri.
// Kalau mau menambah test case baru untuk jenis transaksi lain (BPJS, kartu kredit,
// cicilan, game top-up, dst), WAJIB minta contoh notifikasi asli dulu — jangan
// mengarang format sendiri, karena parser bisa jadi overfit ke pola yang tidak
// pernah benar-benar muncul di notifikasi Digipos/Alpines sungguhan.

import { parseNotifikasi } from "../src/lib/parser";

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

const testCases: TestCase[] = [
  // ===== PULSA =====
  {
    nama: "Pulsa - format lengkap",
    provider: "digipos",
    rawText:
      "Isi ulang pulsa Rp 20000 untuk no pelanggan 6285176740026 telah berhasil dengan SN 04224600001707226406 dan ID Transaksi DGPS260726164455775705549",
    ekspektasi: {
      jenis_transaksi: "pulsa",
      nominal: 20000,
      nomor_tujuan: "6285176740026",
      status: "sukses",
    },
  },
  {
    nama: "Pulsa - tanpa nominal (format SMS backup)",
    provider: "digipos",
    rawText:
      "Isi ulang pulsa untuk no. 6285176740026 telah berhasil dengan SN: 04224600001707226406 pada 14/08/2026 09:44:37",
    ekspektasi: {
      jenis_transaksi: "pulsa",
      nominal: null,
      nomor_tujuan: "6285176740026",
      status: "sukses",
      perlu_review: true,
    },
  },

  // ===== PAKET DATA =====
  {
    nama: "Paket Data - byU Kaget",
    provider: "digipos",
    rawText:
      "Transaksi pengisian paket data byU Kaget 11 GB 28 Hari 28 Hari pada 12 August 2026 10:17:29 senilai Rp41800 telah berhasil. MSISDN: 6285194309031. ID Transaksi: DGPS260812221726516954578",
    ekspektasi: {
      jenis_transaksi: "paket_data",
      nominal: 41800,
      nomor_tujuan: "6285194309031",
      nama_produk: "byU Kaget 11 GB 28 Hari 28 Hari",
      status: "sukses",
    },
  },
  {
    nama: "Paket Data - Voucher AIGO (Alpines, fallback nominal dari saldo)",
    provider: "alpines",
    rawText:
      "VOUCHER AIGO 5.5 gb 3 hari *838*nomor voucher#VA5.0838 Berhasil. SN/Ref: :3170 0838 8279 5759. Saldo 309.523 - 11950 = 297.573 @15/08 20:44:39",
    ekspektasi: {
      jenis_transaksi: "paket_data",
      nominal: 11950,
      nama_produk: "AIGO 5.5 gb 3 hari",
      status: "sukses",
      perlu_review: true,
    },
  },
  {
    nama: "Paket Data - Talkmania (tanpa kata 'data', tanpa pola GB/Hari)",
    provider: "digipos",
    rawText:
      "Isi ulang paket Talkmania Sakti Bulanan 6281374087911 pd 21/08/2026 16:04:39 berhasil. Voucher senilai Rp7999. Nomor seri 04250600000200678066. Cek sisa stock di *181*1*5*2*PIN#.",
    ekspektasi: {
      jenis_transaksi: "paket_nelpon",
      nama_produk: "Talkmania Sakti Bulanan",
      nominal: 7999,
      status: "sukses",
    },
  },

  // ===== PLN =====
  {
    nama: "PLN - Rp100.000 (token + nomor meter + nama pelanggan)",
    provider: "digipos",
    rawText:
      "Anda telah melakukan pembayaran PLN senilai 100000 pada 21-08-2026 09:05:37 Biaya admin 2400. ID Transaksi DGPS260821090524901272902 Saldo LinkAja 70186. Token PLN Prabayar Anda 6925 8840 4057 0985 4046. Nometer 14306947673 atas nama HANSHELA II. 63 kWh",
    ekspektasi: {
      jenis_transaksi: "pln",
      nominal: 100000,
      nomor_tujuan: "14306947673",
      status: "sukses",
    },
  },
  {
    nama: "PLN - Rp20.000 (varian kedua, konfirmasi fallback status implisit konsisten)",
    provider: "digipos",
    rawText:
      "Anda telah melakukan pembayaran PLN senilai 20000 pada 15-08-2026 20:06:51 Biaya admin 2400. ID Transaksi DGPS260815200638691929521 Saldo LinkAja 48385. Token PLN Prabayar Anda 0729 7524 0633 7904 1805. Nometer 86031518763 atas nama ALAM SUKDIN. 18,9 kWh",
    ekspektasi: {
      jenis_transaksi: "pln",
      nominal: 20000,
      nomor_tujuan: "86031518763",
      status: "sukses",
    },
  },

  // ===== E-WALLET (ALPINES) =====
  {
    nama: "E-wallet DANA - format 1 (tanpa nama pemilik)",
    provider: "alpines",
    rawText:
      "Saldo DANA50.081261592333 Berhasil. SN/Ref: DANA TOPUP/MXX INDXXXXXX/50000/081261592333/REFF:2026072610121481030100166970654515631. Saldo 998.218 - 50.650 = 947.568 @26/07 21:03:16",
    ekspektasi: {
      jenis_transaksi: "ewallet",
      nominal: 50650,
      nomor_tujuan: "081261592333",
      nama_produk: "DANA",
      status: "sukses",
    },
  },
  {
    nama: "E-wallet DANA - format 2 (dengan nama pemilik & NOMINAL eksplisit)",
    provider: "alpines",
    rawText:
      "Saldo DANA.200.081267746287 Berhasil. SN/Ref: NAMA:DNID-AVRXXXX WIJXXXXXX/NOMINAL:200000/IDT:2026081510121481030100166963767458397. Saldo 731-423 - 200.850 = 530.573 @15/08 13:17:49",
    ekspektasi: {
      jenis_transaksi: "ewallet",
      nominal: 200000,
      nomor_tujuan: "081267746287",
      nama_produk: "DANA",
      nama_pemilik: "DNID-AVRXXXX WIJXXXXXX",
      status: "sukses",
    },
  },
  {
    nama: "E-wallet GoPay",
    provider: "alpines",
    rawText:
      "SALDO GOPAY GO100.081372331339 Berhasil. SN/Ref: GOPAY/Jasmisaputra/100000/081372331339/REFF:0420260814154213iJ5AJAncKMID. Saldo 231.173 - 102.150 = 129.023 @14/08 22:42:31",
    ekspektasi: {
      jenis_transaksi: "ewallet",
      nominal: 100000,
      nomor_tujuan: "081372331339",
      nama_produk: "GoPay",
      nama_pemilik: "Jasmisaputra",
      status: "sukses",
    },
  },

  // ===== GAME TOP-UP =====
  {
    nama: "Game Top-Up - Free Fire (fallback nominal dari saldo)",
    provider: "alpines",
    rawText:
      "FREE FIRE FF95.1622224897 Berhasil. SN/Ref: 323a4529-10bb-4c9b-9dfe-65d1af0cd0c7. Saldo 464.923 14.450 450.473 @15/08 13:50:26",
    ekspektasi: {
      jenis_transaksi: "game_topup",
      nama_produk: "FREE FIRE",
      nominal: 14450,
      status: "sukses",
      perlu_review: true,
    },
  },

  // ===== TOKEN LISTRIK VIA RESELLER ALPINES =====
  {
    nama: "Token Listrik Reseller (format PH)",
    provider: "alpines",
    rawText:
      "TOKEN 100000 PH100.50211348581 Berhasil. SN/Ref: 6923-1953-7450-9273-3786/ANDRIKO/B1/1300VA/94.2 Saldo 149.523 - 102.450 = 47.073 @13/08 22:13:53",
    ekspektasi: { nominal: 100000, status: "sukses" },
  },

  // ===== TRANSAKSI PENDING (TIDAK BOLEH TAMPIL DI DASHBOARD UTAMA) =====
  {
    nama: "Pending - Voucher Three 'akan diproses' (nominal HARUS null, bukan angka karangan)",
    provider: "alpines",
    rawText:
      "Voucher Three 5.5 gb 3 hr *888*Nomor Sn# VTR10.0895 akan diproses @13:23. Tunggu SMS notifikasi sebelum penggunaan",
    ekspektasi: { nominal: null, status: "pending" },
  },
  {
    nama: "Sukses - Voucher Three menyusul (kode header sama, SN/Ref beda, fallback nominal dari saldo)",
    provider: "alpines",
    rawText:
      "Voucher Three 5.5 gb 3 hr *888*Nomor Sn# VTR10.0895 Berhasil. SN/Ref: :4066 3084 4883 9905. Saldo 52.927 - 13150 = 39.777 @21/08 13:23:20",
    ekspektasi: { nominal: 13150, status: "sukses", perlu_review: true },
  },
];

function bandingkan(
  aktual: any,
  ekspektasi: TestCase["ekspektasi"],
): { pass: boolean; selisih: string[] } {
  const selisih: string[] = [];
  for (const [key, nilaiEkspektasi] of Object.entries(ekspektasi)) {
    if (aktual[key] !== nilaiEkspektasi) {
      selisih.push(
        `${key}: ekspektasi=${JSON.stringify(nilaiEkspektasi)}, aktual=${JSON.stringify(aktual[key])}`,
      );
    }
  }
  return { pass: selisih.length === 0, selisih };
}

function jalankanTest() {
  console.log("=== MULAI TEST PARSER LOKAL ===\n");
  console.log(
    `Total kasus: ${testCases.length} (semua dari notifikasi nyata yang sudah dikonfirmasi)\n`,
  );
  let jumlahPass = 0;

  for (const kasus of testCases) {
    const hasilAktual = parseNotifikasi({
      provider: kasus.provider,
      rawText: kasus.rawText,
    });
    const { pass, selisih } = bandingkan(hasilAktual, kasus.ekspektasi);

    if (pass) {
      jumlahPass++;
      console.log(`✅ PASS - ${kasus.nama}`);
    } else {
      console.log(`❌ FAIL - ${kasus.nama}`);
      selisih.forEach((s) => console.log(`     ${s}`));
    }
  }

  console.log(`\n=== HASIL: ${jumlahPass}/${testCases.length} PASS ===`);

  if (jumlahPass < testCases.length) {
    console.log(
      "\n⚠️  Ada kasus gagal — perbaiki parser sesuai instruksi di dokumen Fase 2.3.2 sebelum lanjut.",
    );
    process.exit(1);
  } else {
    console.log(
      "\n✅ Semua kasus dari notifikasi nyata lolos. Parser siap untuk tahap testing berikutnya.",
    );
  }
}

jalankanTest();
