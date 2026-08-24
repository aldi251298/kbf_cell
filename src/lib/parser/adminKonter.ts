/**
 * Sistem Biaya Admin Konter — Fase 2.7
 *
 * nominal_final (yang tampil di dashboard) = nominal_dasar + admin_konter
 *
 * admin_konter adalah biaya flat yang dibayar konsumen ke konter,
 * ditentukan lewat tabel tier di bawah — sudah termasuk fee internal
 * Alpines/Digipos di dalamnya (tidak dijumlah terpisah lagi).
 */

export interface TierAdmin {
  batasAtas: number;
  admin: number;
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
      { batasAtas: 99000, admin: 3000 }, // <= 99.000
      { batasAtas: Infinity, admin: 5000 }, // > 99.000
    ],
  },
  {
    jenisTransaksi: "ewallet", // e-wallet SELAIN DANA (GoPay, OVO, ShopeePay, dst) — flat
    tierList: [{ batasAtas: Infinity, admin: 5000 }],
  },
  {
    jenisTransaksi: "pln", // berlaku PLN via Digipos MAUPUN Alpines
    tierList: [
      { batasAtas: 50000, admin: 4000 },
      { batasAtas: Infinity, admin: 5000 },
    ],
  },
  {
    jenisTransaksi: "tagihan", // sama persis tier PLN (tagihan Telkom, dll)
    tierList: [
      { batasAtas: 50000, admin: 4000 },
      { batasAtas: Infinity, admin: 5000 },
    ],
  },
  {
    jenisTransaksi: "pulsa", // berlaku Digipos MAUPUN Alpines
    tierList: [{ batasAtas: Infinity, admin: 2000 }],
  },
  {
    jenisTransaksi: "paket_data",
    tierList: [{ batasAtas: Infinity, admin: 2000 }],
  },
  // paket_nelpon, game_topup, voucher_fisik, dan kategori "lainnya_*"
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
  return {
    nominalFinal: nominalDasar + admin,
    adminKonter: admin,
    adaAturan: true,
  };
}
