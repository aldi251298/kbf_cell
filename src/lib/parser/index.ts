/**
 * Parser Terpusat — Entry Point (Bagian 3).
 *
 * parseNotifikasi(provider, rawText) mengembalikan ParsedTransaksi lengkap.
 * Prinsip: setiap field diekstrak independen, transaksi tidak pernah ditolak.
 */

import type { ParsedTransaksi } from "./types";
import { detectJenisTransaksi } from "./detectJenisTransaksi";
import { extractNominal } from "./extractNominal";
import { extractNomorTujuan } from "./extractNomorTujuan";
import { extractStatus } from "./extractStatus";
import { extractProviderSeluler } from "./extractProviderSeluler";
import { extractNamaProduk } from "./extractNamaProduk";
import { extractDetailTambahan } from "./extractDetailTambahan";
import { extractWaktuOpsional } from "./extractWaktuOpsional";

export { detectJenisTransaksi } from "./detectJenisTransaksi";
export { extractNominal } from "./extractNominal";
export { extractNomorTujuan } from "./extractNomorTujuan";
export { extractStatus } from "./extractStatus";
export { extractProviderSeluler } from "./extractProviderSeluler";
export { extractNamaProduk } from "./extractNamaProduk";
export { extractDetailTambahan } from "./extractDetailTambahan";
export { extractWaktuOpsional } from "./extractWaktuOpsional";

export interface ParseNotifikasiOptions {
  /** Provider dari client (digipos / alpines) — digunakan untuk konteks, bukan untuk deteksi */
  provider: string;
  /** Raw notification text dari client */
  rawText: string;
}

export function parseNotifikasi(options: ParseNotifikasiOptions): ParsedTransaksi {
  const { provider, rawText } = options;
  const text = rawText.trim();

  // 1. Deteksi jenis transaksi (scoring)
  const jenisTransaksi = detectJenisTransaksi(text);

  // 2. Ekstraksi field independen
  const nominal = extractNominal(text, jenisTransaksi);
  const nomorTujuan = extractNomorTujuan(text, jenisTransaksi);
  const status = extractStatus(text);
  const providerSeluler =
    jenisTransaksi === "pulsa" ? extractProviderSeluler(text, nomorTujuan) : null;

  // Deteksi nama e-wallet untuk nama_produk
  const ewalletName = detectEwalletName(text);
  const namaProduk = extractNamaProduk(text, jenisTransaksi, ewalletName);
  const namaPemilik = extractNamaPemilik(text);

  // 3. Sanity check — tandai perlu_review jika ada masalah
  const alasanReview = computeAlasanReview({
    jenisTransaksi,
    nominal,
    nomorTujuan,
    status,
  });
  const perluReview = alasanReview !== null;

  // 4. ID transaksi — gunakan kombinasi provider + hash teks agar stabil
  const id_transaksi_provider = computeStableId(provider, text);

  // 5. Detail tambahan
  const detailTambahan = extractDetailTambahan(text, jenisTransaksi, alasanReview);

  // 6. Waktu opsional (hanya untuk referensi, tidak disimpan sebagai waktu_transaksi)
  extractWaktuOpsional(text);

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

  // Pola 2: Segmen kedua di SN/Ref setelah nama e-wallet (format: EWALLET/nama/nominal/nomor/REFF:...)
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

  if (jenisTransaksi === "belum_dikenal") return "jenis_transaksi tidak dikenali";
  if (nominal === null || nominal <= 0) return "nominal tidak ditemukan atau nol";
  if (
    nomorTujuan === null &&
    ["pulsa", "paket_data", "ewallet"].includes(jenisTransaksi)
  ) {
    return `nomor_tujuan tidak ditemukan untuk ${jenisTransaksi}`;
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