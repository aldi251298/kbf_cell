/**
 * Parser Terpusat — Entry Point (Bagian 3).
 *
 * parseNotifikasi(provider, rawText) mengembalikan ParsedTransaksi lengkap.
 * Prinsip: setiap field diekstrak independen, transaksi tidak pernah ditolak.
 * Updated for Fase 2.7: Nominal dasar Alpines + Admin Konter system.
 */

import type { ParsedTransaksi } from "./types";
import { detectJenisTransaksi } from "./detectJenisTransaksi";
import { extractNominal } from "./extractNominal";
import { extractNomorTujuan } from "./extractNomorTujuan";
import { extractProviderSeluler } from "./extractProviderSeluler";
import { extractNamaProduk } from "./extractNamaProduk";
import { extractDetailTambahan } from "./extractDetailTambahan";
import { extractWaktuOpsional } from "./extractWaktuOpsional";
import {
  pisahkanSaldoAplikasi,
  apakahTransaksiPelanggan,
  parseStrukturAlpines,
  tebakJenisTransaksiUniversal,
  extractStatusUniversal,
  normalisasiWhitespace,
} from "./universal";
import { parseAngkaIndonesia } from "./extractNominal";
import { extractNominalForAlpines } from "./extractNominal";
import { terapkanAdminKonter } from "./adminKonter";

export { detectJenisTransaksi } from "./detectJenisTransaksi";
export { extractNominal } from "./extractNominal";
export { extractNomorTujuan } from "./extractNomorTujuan";
export { extractStatus } from "./extractStatus";
export { extractProviderSeluler } from "./extractProviderSeluler";
export { extractNamaProduk } from "./extractNamaProduk";
export { extractDetailTambahan } from "./extractDetailTambahan";
export { extractWaktuOpsional } from "./extractWaktuOpsional";
export {
  pisahkanSaldoAplikasi,
  apakahTransaksiPelanggan,
  tebakJenisTransaksiUniversal,
  parseStrukturAlpines,
  normalisasiWhitespace,
  apakahNotifikasiPendingAlpines,
} from "./universal";
export { extractNominalForAlpines } from "./extractNominal";
export { terapkanAdminKonter } from "./adminKonter";

export interface ParseNotifikasiOptions {
  /** Provider dari client (digipos / alpines) — digunakan untuk konteks, bukan untuk deteksi */
  provider: string;
  /** Raw notification text dari client */
  rawText: string;
}

/**
 * Main parsing function - synchronous version for known categories only.
 * For full dynamic category support, use parseNotifikasiUniversal (async).
 */
export function parseNotifikasi(
  options: ParseNotifikasiOptions,
): ParsedTransaksi {
  const { provider, rawText } = options;

  // 0. Normalisasi whitespace SEBELUM semua ekstraksi (Bug 5 fix)
  // Gunakan versi ternormalisasi untuk SEMUA proses ekstraksi field,
  // tapi raw_notification_text yang disimpan ke DB tetap versi ASLI
  const text = normalisasiWhitespace(rawText);

  // 1. Deteksi jenis transaksi (synchronous, known categories only)
  const jenisTransaksi = detectJenisTransaksi(text);

  // 2. Extract detailTambahan (without alasanReview) for status extraction
  const detailTambahanForStatus = extractDetailTambahan(
    text,
    jenisTransaksi,
    null,
  );

  // 3. Extract status using extractStatusUniversal
  const { status, perluReview: perluReviewStatus } = extractStatusUniversal(
    text,
    jenisTransaksi,
    detailTambahanForStatus ?? {},
  );

  // 4. Extract nomor tujuan
  const nomorTujuan = extractNomorTujuan(text, jenisTransaksi);

  // 5. Extract provider seluler (only for pulsa)
  const providerSeluler =
    jenisTransaksi === "pulsa"
      ? extractProviderSeluler(text, nomorTujuan)
      : null;

  // 6. Detect e-wallet name for nama_produk
  const ewalletName = detectEwalletName(text);

  // 7. Extract nama produk
  const namaProduk = extractNamaProduk(text, jenisTransaksi, ewalletName);

  // 8. Extract nama pemilik
  const namaPemilik = extractNamaPemilik(text);

  // 9. Extract nominal
  let nominal: number | null = null;
  let nominalDasar: number | null = null;
  let sumberDasar: string | null = null;
  let adminKonter = 0;

  if (provider === "alpines") {
    const nominalResult = extractNominalForAlpines(text);
    nominalDasar = nominalResult.nominalDasar;
    sumberDasar = nominalResult.sumberDasar;

    // Apply admin konter fee
    const adminResult = terapkanAdminKonter(
      nominalDasar,
      jenisTransaksi,
      namaProduk,
    );
    nominal = adminResult.nominalFinal;
    adminKonter = adminResult.adminKonter;
  } else {
    nominalDasar = extractNominal(text, jenisTransaksi);
    // Apply admin konter fee for Digipos too
    const adminResult = terapkanAdminKonter(
      nominalDasar,
      jenisTransaksi,
      namaProduk,
    );
    nominal = adminResult.nominalFinal;
    adminKonter = adminResult.adminKonter;
  }

  // 10. Extract waktu opsional (hanya untuk referensi, tidak disimpan sebagai waktu_transaksi)
  extractWaktuOpsional(text);

  // 11. Compute alasan review
  const alasanReview = computeAlasanReview({
    jenisTransaksi,
    nominal,
    nomorTujuan,
    status,
  });

  // 12. Detail tambahan lengkap (tambahkan alasan review jika ada)
  const detailTambahan = { ...detailTambahanForStatus };
  if (alasanReview && detailTambahan) {
    detailTambahan.alasan_review = alasanReview;
  }
  // Fase 2.7: Add nominal_dasar, sumber_nominal_dasar, admin_konter
  if (nominalDasar !== null) {
    detailTambahan.nominal_dasar = nominalDasar;
  }
  if (sumberDasar) {
    detailTambahan.sumber_nominal_dasar = sumberDasar;
  }
  // Always include admin_konter (even 0) for audit trail
  detailTambahan.admin_konter = adminKonter;
  // Add saldo_konter object for Alpines
  if (provider === "alpines") {
    const structure = parseStrukturAlpines(text);
    if (structure.saldoMatch) {
      const saldoAwal = parseAngkaIndonesia(structure.saldoMatch[1]);
      const potongan = parseAngkaIndonesia(structure.saldoMatch[2]);
      const saldoAkhir = parseAngkaIndonesia(structure.saldoMatch[3]);
      detailTambahan.saldo_konter = {
        sebelum: saldoAwal,
        terpakai: potongan,
        sesudah: saldoAkhir,
      };
    }
  }

  // 13. ID transaksi — gunakan kombinasi provider + hash teks agar stabil
  const id_transaksi_provider = computeStableId(provider, text);

  // 14. Sanity check — tandai perlu_review jika ada masalah
  const perluReview =
    alasanReview !== null ||
    (provider === "alpines" && sumberDasar === "fallback_saldo") ||
    perluReviewStatus;

  return {
    provider,
    id_transaksi_provider,
    jenis_transaksi: jenisTransaksi,
    nominal,
    nomor_tujuan: nomorTujuan,
    nama_produk: namaProduk,
    provider_seluler: providerSeluler,
    nama_pemilik: namaPemilik,
    status,
    raw_notification_text: rawText,
    detail_tambahan: detailTambahan,
    perlu_review: perluReview,
  };
}

/**
 * Universal async parsing function with full Fase 2.3.1 features:
 * - Saldo aplikasi separation (both providers)
 * - Non-transaction filter
 * - Dynamic category detection with DB lookup
 * - Alpines structure parsing
 * - Expanded status keywords
 * Returns parsed result plus metadata about filtering
 */
export async function parseNotifikasiUniversal(
  options: ParseNotifikasiOptions,
): Promise<{
  parsed: ParsedTransaksi | null;
  filtered: boolean;
  filterReason?: string;
  saldoInfo: string | null;
}> {
  const { provider, rawText } = options;

  // 0. Normalisasi whitespace SEBELUM semua ekstraksi (Bug 5 fix)
  // Gunakan versi ternormalisasi untuk SEMUA proses ekstraksi field,
  // tapi raw_notification_text yang disimpan ke DB tetap versi ASLI
  const teksTernormalisasi = normalisasiWhitespace(rawText);

  // 1. Parse struktur Alpines DULU (sebelum pisahkan saldo) agar saldoMatch tidak hilang
  let alpinesStructure = null;
  if (provider === "alpines") {
    alpinesStructure = parseStrukturAlpines(teksTernormalisasi);
  }

  // 2. Pisahkan saldo aplikasi (universal untuk kedua provider)
  const { teksTanpaSaldo, saldoInfo } =
    pisahkanSaldoAplikasi(teksTernormalisasi);

  // 3. Klasifikasi apakah ini transaksi pelanggan
  const klasifikasi = apakahTransaksiPelanggan(teksTanpaSaldo);
  if (!klasifikasi.valid) {
    return {
      parsed: null,
      filtered: true,
      filterReason: klasifikasi.alasan,
      saldoInfo,
    };
  }

  // 4. Deteksi jenis transaksi universal (dengan sistem kategori dinamis)
  const headerSegment = alpinesStructure?.headerSegment ?? teksTanpaSaldo;
  const { jenis: jenisTransaksi, perluReview: perluReviewKategori } =
    await tebakJenisTransaksiUniversal(teksTanpaSaldo, headerSegment);

  // 5. Extract nomor tujuan
  const nomorTujuan = extractNomorTujuan(teksTanpaSaldo, jenisTransaksi);

  // 6. Extract provider seluler (only for pulsa)
  const providerSeluler =
    jenisTransaksi === "pulsa"
      ? extractProviderSeluler(teksTanpaSaldo, nomorTujuan)
      : null;

  // 7. Detect e-wallet name for nama_produk
  const ewalletName = detectEwalletName(teksTanpaSaldo);

  // 8. Extract nama produk
  const namaProduk = extractNamaProduk(
    teksTanpaSaldo,
    jenisTransaksi,
    ewalletName,
  );
  const namaPemilik = extractNamaPemilik(teksTanpaSaldo);

  // 9. Status universal (dengan keyword expanded) - need status for nominal extraction
  const detailTambahanTemp = extractDetailTambahan(
    teksTanpaSaldo,
    jenisTransaksi,
    null,
  );
  const { status, perluReview: perluReviewStatus } = extractStatusUniversal(
    teksTanpaSaldo,
    jenisTransaksi,
    detailTambahanTemp ?? {},
  );

  // 10. Ekstraksi field independen (menggunakan teksTanpaSaldo sebagai basis)
  let nominal: number | null = null;
  let nominalDasar: number | null = null;
  let sumberDasar: string | null = null;
  let adminKonter = 0;

  if (provider === "alpines" && alpinesStructure) {
    // Pass pre-parsed structure to avoid re-parsing after saldo removal
    const nominalResult = extractNominalForAlpines(teksTanpaSaldo, alpinesStructure);
    nominalDasar = nominalResult.nominalDasar;
    sumberDasar = nominalResult.sumberDasar;

    // Apply admin konter fee
    const adminResult = terapkanAdminKonter(
      nominalDasar,
      jenisTransaksi,
      namaProduk,
    );
    nominal = adminResult.nominalFinal;
    adminKonter = adminResult.adminKonter;
  } else {
    nominalDasar = extractNominal(teksTanpaSaldo, jenisTransaksi);
    // Apply admin konter fee for Digipos too
    const adminResult = terapkanAdminKonter(
      nominalDasar,
      jenisTransaksi,
      namaProduk,
    );
    nominal = adminResult.nominalFinal;
    adminKonter = adminResult.adminKonter;
  }

  // 11. Sanity check — tandai perlu_review jika ada masalah
  const alasanReview = computeAlasanReview({
    jenisTransaksi,
    nominal,
    nomorTujuan,
    status,
  });
  const perluReview =
    perluReviewKategori || perluReviewStatus || alasanReview !== null;
  // dariSaldoFallback TIDAK lagi memicu perlu_review — ini normal untuk Alpines

  // 12. ID transaksi
  const id_transaksi_provider = computeStableId(provider, teksTanpaSaldo);

  // 13. Detail tambahan lengkap - include Fase 2.7 fields
  const detailTambahan = { ...detailTambahanTemp };
  if (alasanReview && detailTambahan) {
    detailTambahan.alasan_review = alasanReview;
  }
  // Tambahkan saldoInfo ke detail_tambahan untuk audit
  if (saldoInfo && detailTambahan) {
    detailTambahan.saldo_aplikasi_terdeteksi = saldoInfo;
  }
  // Fase 2.7: Add nominal_dasar, sumber_nominal_dasar, admin_konter, saldo_konter
  if (nominalDasar !== null) {
    detailTambahan.nominal_dasar = nominalDasar;
  }
  if (sumberDasar) {
    detailTambahan.sumber_nominal_dasar = sumberDasar;
  }
  // Always include admin_konter (even 0) for audit trail
  detailTambahan.admin_konter = adminKonter;
  // Add saldo_konter object for Alpines
  if (provider === "alpines" && alpinesStructure?.saldoMatch) {
    const saldoAwal = parseAngkaIndonesia(alpinesStructure.saldoMatch[1]);
    const potongan = parseAngkaIndonesia(alpinesStructure.saldoMatch[2]);
    const saldoAkhir = parseAngkaIndonesia(alpinesStructure.saldoMatch[3]);
    detailTambahan.saldo_konter = {
      sebelum: saldoAwal,
      terpakai: potongan,
      sesudah: saldoAkhir,
    };
  }

  // 14. Waktu opsional
  extractWaktuOpsional(teksTanpaSaldo);

  const parsed: ParsedTransaksi = {
    provider,
    id_transaksi_provider,
    jenis_transaksi: jenisTransaksi,
    nominal,
    nomor_tujuan: nomorTujuan,
    nama_produk: namaProduk,
    provider_seluler: providerSeluler,
    nama_pemilik: namaPemilik,
    status,
    raw_notification_text: rawText, // SELALU simpan rawText ASLI UTUH
    detail_tambahan: detailTambahan,
    perlu_review: perluReview,
  };

  return {
    parsed,
    filtered: false,
    saldoInfo,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function detectEwalletName(text: string): string | null {
  const lower = text.toLowerCase();
  const known = ["dana", "gopay", "go-pay", "ovo", "shopeepay", "linkaja"];
  for (const name of known) {
    if (lower.includes(name)) return name;
  }
  return null;
}

function extractNamaPemilik(text: string): string | null {
  // Pola 1: NAMA:... sampai delimiter /
  const namaMatch = text.match(/NAMA:\s*([^/]+)/i);
  if (namaMatch) return namaMatch[1].trim();

  // Pola 2: Segmen kedua di SN/Ref setelah nama e-wallet (format: EWALLET/nama/nomor/nomor/REFF:...)
  const snRefMatch = text.match(/SN\/Ref:\s*(.+?)(?:\.\s*Saldo\s|$)/i);
  if (snRefMatch) {
    const segments = snRefMatch[1].split("/").map((s) => s.trim());
    if (segments.length >= 4) {
      // Segmen ke-2 adalah nama (setelah nama e-wallet di segmen 1)
      const candidate = segments[1];
      // Validasi: tidak terlalu panjang, tidak numerik murni, tidak mengandung "IND" (biasanya operator code)
      if (
        candidate &&
        candidate.length > 0 &&
        candidate.length < 50 &&
        !/^\d+$/.test(candidate) &&
        !/IND/i.test(candidate)
      ) {
        return candidate;
      }
    }
  }

  return null;
}

function computeAlasanReview(params: {
  jenisTransaksi: string;
  nominal: number | null;
  nomorTujuan: string | null;
  status: string;
}): string | null {
  const { jenisTransaksi, nominal, nomorTujuan } = params;

  if (jenisTransaksi === "belum_dikenal")
    return "jenis_transaksi tidak dikenali";
  if (nominal === null || nominal <= 0)
    return "nominal tidak ditemukan atau nol";
  // Nomor tujuan HANYA wajib untuk transaksi pulsa (isi ulang pulsa)
  // paket_data, ewallet, voucher, dll tidak selalu punya nomor tujuan
  if (nomorTujuan === null && jenisTransaksi === "pulsa") {
    return "nomor_tujuan tidak ditemukan untuk pulsa";
  }
  if (jenisTransaksi === "pln" && nomorTujuan === null) {
    return "nomor meter/token PLN tidak ditemukan";
  }
  return null;
}

function computeStableId(provider: string, text: string): string {
  // Gunakan hash sederhana dari teks untuk ID yang stabil
  let hash = 0;
  const str = `${provider}:${text}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `${provider}-${Math.abs(hash).toString(36)}-${Date.now().toString(36)}`;
}
