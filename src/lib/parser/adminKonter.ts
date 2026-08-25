/**
 * Sistem Biaya Admin Konter — Fase 2.7
 *
 * nominal_final (yang tampil di dashboard) = nominal_dasar + admin_konter
 *
 * admin_konter adalah biaya flat yang dibayar konsumen ke konter,
 * ditentukan lewat tabel tier di bawah — sudah termasuk fee internal
 * Alpines/Digipos di dalamnya (tidak dijumlah terpisah lagi).
 */

export type MetodePembulatan =
  | "tidak_ada"
  | "bulatkan_total_setelah_tambah_admin" // voucher_data_alpines: (nominal + admin) dibulatkan ke kelipatan 1000
  | "bulatkan_nominal_dulu_baru_tambah_admin"; // paket_nelpon (Talkmania): nominal dibulatkan DULU, BARU tambah admin flat

export interface TierAdmin {
  batasAtas: number;
  admin: number;
  metodePembulatan?: MetodePembulatan; // Metode pembulatan khusus untuk tier ini
}

export interface AturanAdminKonter {
  jenisTransaksi: string;
  namaProdukFilter?: RegExp;
  tierList: TierAdmin[];
}

export const ATURAN_ADMIN_KONTER: AturanAdminKonter[] = [
  {
    jenisTransaksi: "ewallet",
    namaProdukFilter: /^DANA$/i,
    tierList: [
      { batasAtas: 99000, admin: 3000, metodePembulatan: "tidak_ada" }, // <= 99.000
      { batasAtas: Infinity, admin: 5000, metodePembulatan: "tidak_ada" }, // > 99.000
    ],
  },
  {
    jenisTransaksi: "ewallet", // e-wallet SELAIN DANA (GoPay, OVO, ShopeePay, dst) — flat
    tierList: [
      { batasAtas: Infinity, admin: 5000, metodePembulatan: "tidak_ada" },
    ],
  },
  {
    jenisTransaksi: "pln", // berlaku PLN via Digipos MAUPUN Alpines
    tierList: [
      { batasAtas: 50000, admin: 4000, metodePembulatan: "tidak_ada" },
      { batasAtas: Infinity, admin: 5000, metodePembulatan: "tidak_ada" },
    ],
  },
  {
    jenisTransaksi: "tagihan", // sama persis tier PLN (tagihan Telkom, dll)
    tierList: [
      { batasAtas: 50000, admin: 4000, metodePembulatan: "tidak_ada" },
      { batasAtas: Infinity, admin: 5000, metodePembulatan: "tidak_ada" },
    ],
  },
  {
    jenisTransaksi: "pulsa", // berlaku Digipos MAUPUN Alpines
    tierList: [
      { batasAtas: Infinity, admin: 2000, metodePembulatan: "tidak_ada" },
    ],
  },
  {
    jenisTransaksi: "paket_data",
    tierList: [
      { batasAtas: Infinity, admin: 2000, metodePembulatan: "tidak_ada" },
    ],
  },
  {
    jenisTransaksi: "voucher_data_alpines",
    tierList: [
      {
        batasAtas: Infinity,
        admin: 1000,
        metodePembulatan: "bulatkan_total_setelah_tambah_admin",
      },
    ],
  },
  {
    jenisTransaksi: "paket_nelpon", // Talkmania (Digipos) — rumus BEDA dari voucher_data_alpines
    tierList: [
      {
        batasAtas: Infinity,
        admin: 2000,
        metodePembulatan: "bulatkan_nominal_dulu_baru_tambah_admin",
      },
    ],
  },
  // game_topup, voucher_fisik, dan kategori "lainnya_*"
  // SENGAJA TIDAK didaftarkan — admin default 0 sampai ada info tarif pasti
  // JANGAN menebak tarif untuk kategori ini.
];

/**
 * Terapkan biaya admin konter berdasarkan nominal dasar, jenis transaksi, dan nama produk
 *
 * @param nominalDasar - Nominal dasar produk (tanpa fee)
 * @param jenisTransaksi - Jenis transaksi (pulsa, paket_data, ewallet, pln, tagihan, dll)
 * @param namaProduk - Nama produk (untuk filter khusus seperti DANA)
 * @returns { nominalFinal, adminKonter, adaAturan }
 */
export function terapkanAdminKonter(
  nominalDasar: number | null,
  jenisTransaksi: string,
  namaProduk: string | null,
): { nominalFinal: number | null; adminKonter: number; adaAturan: boolean } {
  if (nominalDasar == null) {
    return { nominalFinal: null, adminKonter: 0, adaAturan: false };
  }

  const kandidat = ATURAN_ADMIN_KONTER.filter(
    (a) => a.jenisTransaksi === jenisTransaksi,
  );
  const spesifik = kandidat.find((a) =>
    a.namaProdukFilter?.test(namaProduk ?? ""),
  );
  const aturan = spesifik ?? kandidat.find((a) => !a.namaProdukFilter);

  if (!aturan) {
    return { nominalFinal: nominalDasar, adminKonter: 0, adaAturan: false };
  }

  const tier = aturan.tierList.find((t) => nominalDasar <= t.batasAtas);
  const admin = tier?.admin ?? 0;
  const metodePembulatan = tier?.metodePembulatan ?? "tidak_ada";

  let nominalFinal: number;

  switch (metodePembulatan) {
    case "bulatkan_total_setelah_tambah_admin":
      // voucher_data_alpines: (nominal + admin) dibulatkan ke kelipatan 1000
      nominalFinal = Math.ceil((nominalDasar + admin) / 1000) * 1000;
      break;
    case "bulatkan_nominal_dulu_baru_tambah_admin":
      // paket_nelpon (Talkmania): nominal dibulatkan DULU ke kelipatan 1000, BARU tambah admin flat
      const nominalDibulatkan = Math.ceil(nominalDasar / 1000) * 1000;
      nominalFinal = nominalDibulatkan + admin;
      break;
    case "tidak_ada":
    default:
      // Default: tidak ada pembulatan, nominalFinal = nominalDasar + admin
      nominalFinal = nominalDasar + admin;
      break;
  }

  // Keuntungan aktual = nominalFinal - nominalDasar (bukan nilai config admin flat)
  // Ini penting untuk kategori dengan pembulatan (seperti voucher_data_alpines, paket_nelpon)
  // di mana margin aktual bisa beda dari nilai config akibat pembulatan ke kelipatan 1000
  const adminAktual = nominalFinal - nominalDasar;

  return {
    nominalFinal,
    adminKonter: adminAktual,
    adaAturan: true,
  };
}
