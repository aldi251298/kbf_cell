/**
 * Universal Parser Functions — Fase 2.3 & 2.3.1
 *
 * Contains:
 * 1. parseStrukturAlpines - Universal Alpines structure parser
 * 2. pisahkanSaldoAplikasi - Separate app balance from transaction text (both providers)
 * 3. apakahTransaksiPelanggan - Filter non-transaction notifications
 * 4. tebakJenisTransaksiUniversal - Dynamic category detection with DB lookup
 * 5. normalisasiWhitespace - Normalize whitespace before parsing (Bug 5 fix)
 */

// ============================================================================
// 0. NORMALISASI WHITESPACE (Bug 5 fix)
// ============================================================================

/**
 * Normalize whitespace in raw text before parsing.
 * Replaces all whitespace sequences (including newlines, tabs) with single space.
 * This ensures regex patterns that assume single-line text work correctly.
 *
 * IMPORTANT: raw_notification_text saved to DB should remain the ORIGINAL version
 * with line breaks intact. This function is only for parsing/extraction purposes.
 */
export function normalisasiWhitespace(rawText: string): string {
  return rawText.replace(/\s+/g, " ").trim();
}

import { createServiceRoleClient } from "@/lib/supabase/server";

// ============================================================================
// 1. PISAHAN SALDO APLIKASI (Universal - both Digipos & Alpines)
// ============================================================================

const polaSaldoAplikasi =
  /Saldo\s+(LinkAja|Digipos|Alpines|Dompet)?\s*[\d.,]+(\s*-\s*[\d.,]+\s*=\s*[\d.,]+)?(\s*@\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}:\d{2})?/gi;

export function pisahkanSaldoAplikasi(rawText: string): {
  teksTanpaSaldo: string;
  saldoInfo: string | null;
} {
  const match = rawText.match(polaSaldoAplikasi);
  if (!match) return { teksTanpaSaldo: rawText, saldoInfo: null };

  return {
    teksTanpaSaldo: rawText.replace(polaSaldoAplikasi, "").trim(),
    saldoInfo: match.join(" | "),
  };
}

// ============================================================================
// 2. FILTER NOTIFIKASI NON-TRANSAKSI
// ============================================================================

const keywordBukanTransaksi =
  /\b(promo|info|pengumuman|notifikasi rutin|selamat datang|kode referral|yuk\s|cashback|event\s|maintenance|gangguan sistem sedang|pemberitahuan|reminder|newsletter|gebyar|raih hadiah|undian|berhadiah|hadiah\s+(utama|menarik)|program\s+(khusus|spesial)|semarak|meriahkan|kejar target|kerjar target|periode\s+\d|syarat dan ketentuan|s&k berlaku)\b/i;

const keywordTopUpSaldoSendiri =
  /\b(top\s?up saldo (digipos|alpines|akun|deposit)|isi saldo aplikasi|deposit anda|saldo anda (bertambah|ditambahkan)|pengisian saldo (digipos|alpines|dompet) anda)\b/i;

const keywordStatusTransaksi =
  /\b(berhasil|sukses|gagal|pending|diproses|akan diproses)\b/i;

export function apakahTransaksiPelanggan(rawText: string): {
  valid: boolean;
  alasan?: string;
} {
  const adaNomorTujuan = /\b(08|62)\d{8,11}\b/.test(rawText);
  const adaReferensi = /\b(SN|REFF|ID Transaksi|IDT|Nomor seri)\b/i.test(
    rawText,
  );
  const adaStatusTransaksi = keywordStatusTransaksi.test(rawText);
  const adaNominalEksplisit = /\bRp\.?\s?[\d.,]+|\bNOMINAL:\s?[\d.,]+/i.test(
    rawText,
  );
  const adaNominalValid = adaNominalEksplisit && adaStatusTransaksi;

  // CEK KHUSUS: Top-up saldo aplikasi sendiri — SELALU ditolak, bukan transaksi pelanggan
  // Cek ini HARUS sebelum cek struktur, karena notifikasi top-up saldo punya struktur
  // mirip transaksi (ada status "berhasil" + nominal), tapi bukan transaksi pelanggan.
  if (keywordTopUpSaldoSendiri.test(rawText)) {
    return { valid: false, alasan: "top_up_saldo_aplikasi_sendiri" };
  }

  // CEK PALING AWAL: kalau struktur transaksi sudah kuat (ada penanda tujuan/referensi/nominal
  // DAN ada kata status transaksi eksplisit), langsung anggap valid — TIDAK PEDULI ada kata
  // "promo" atau kata blocklist lain di dalam nama produknya. Struktur data yang menang, bukan
  // sekadar kecocokan kata.
  const strukturTransaksiKuat =
    (adaNomorTujuan || adaReferensi || adaNominalValid) && adaStatusTransaksi;
  if (strukturTransaksiKuat) {
    return { valid: true };
  }

  // Baru kalau strukturnya lemah/tidak jelas, keyword blocklist jadi penentu
  if (keywordBukanTransaksi.test(rawText)) {
    return { valid: false, alasan: "terdeteksi_promo_atau_info" };
  }

  if (!adaNomorTujuan && !adaReferensi && !adaNominalValid) {
    return { valid: false, alasan: "tidak_ada_elemen_transaksi" };
  }

  return { valid: true };
}

// ============================================================================
// 3. PARSE STRUKTUR ALPINES (Universal base extractor)
// ============================================================================

export interface AlpinesStructure {
  headerSegment: string;
  statusKeyword: string | null;
  snRefSegment: string;
  saldoMatch: RegExpMatchArray | null;
}

export function parseStrukturAlpines(rawText: string): AlpinesStructure {
  // Cari titik potong "Berhasil"/"Gagal" — pemisah header vs sisanya
  const statusMatch = rawText.match(/\b(Berhasil|Gagal)\b/i);
  const headerSegment = statusMatch
    ? rawText.slice(0, statusMatch.index).trim()
    : rawText;
  const statusKeyword = statusMatch?.[1]?.toLowerCase() ?? null;

  // Cari segmen SN/Ref
  const snRefMatch = rawText.match(
    /SN\/Ref:?\s*([\s\S]*?)(?=\s*Saldo\s+[\d.,]+)/i,
  );
  const snRefSegment = snRefMatch?.[1]?.trim() ?? "";

  // Segmen saldo — SELALU pola terakhir, pisahkan jadi 3 angka
  // Regex ketat dulu (dengan - dan =)
  // Updated: [\d.,-]+ to handle dashes as thousand separators (e.g., "731-423")
  let saldoMatch = rawText.match(
    /Saldo\s+([\d.,-]+)\s*-\s*([\d.,-]+)\s*=\s*([\d.,-]+)\s*@(\d{1,2}\/\d{1,2})\s+(\d{1,2}:\d{2}:\d{2})/i,
  );

  // Fallback ke regex longgar kalau yang ketat tidak match
  if (!saldoMatch) {
    saldoMatch = rawText.match(
      /Saldo\s+([\d.,-]+)[\s\-]+([\d.,-]+)[\s=]+([\d.,-]+)\s*@/i,
    );
  }

  return {
    headerSegment,
    statusKeyword,
    snRefSegment,
    saldoMatch,
  };
}

// ============================================================================
// 4. TEBAK JENIS TRANSAKSI UNIVERSAL (Dynamic Category System)
// ============================================================================

import { scoringKeywordKategori } from "./detectJenisTransaksi";

export interface TebakJenisResult {
  jenis: string;
  perluReview: boolean;
}

// Use the shared scoring function from detectJenisTransaksi which includes
// scoringPaketAtauPulsa logic for paket_nelpon vs paket_data (including Talkmania)

export async function tebakJenisTransaksiUniversal(
  rawText: string,
  headerSegment: string,
): Promise<TebakJenisResult> {
  // 1. Cek terhadap kategori resmi yang sudah di-hardcode
  const hasilKnown = await scoringKeywordKategori(rawText);
  if (hasilKnown.skor > 0) {
    return { jenis: hasilKnown.kategori, perluReview: false };
  }

  // 2. Tebak kode kategori dari header
  const kataPertama = headerSegment
    .split(/\s+/)[0]
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "_");
  if (!kataPertama || kataPertama.length <= 2) {
    return { jenis: "belum_dikenal", perluReview: true };
  }
  const kodeKategori = `lainnya_${kataPertama}`;

  // 3. Cek apakah kategori ini SUDAH PERNAH muncul sebelumnya
  const supabase = createServiceRoleClient();
  const { data: existing } = await supabase
    .from("kategori_transaksi_dinamis")
    .select("*")
    .eq("kode", kodeKategori)
    .maybeSingle();

  if (existing) {
    // Sudah pernah muncul — kenali otomatis, TIDAK perlu review lagi
    await supabase
      .from("kategori_transaksi_dinamis")
      .update({
        jumlah_kemunculan: existing.jumlah_kemunculan + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("kode", kodeKategori);

    return { jenis: kodeKategori, perluReview: false };
  }

  // Kemunculan PERTAMA — catat kategori baru, DAN tandai review (hanya kali ini)
  await supabase.from("kategori_transaksi_dinamis").insert({
    kode: kodeKategori,
    label_tampilan: kataPertama
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    contoh_header: headerSegment.slice(0, 100),
  });

  return { jenis: kodeKategori, perluReview: true };
}

// ============================================================================
// 5. EKSTRAKSI NOMINAL UNTUK ALPINES (Priority Order)
// ============================================================================

export function extractNominalAlpines(
  _text: string,
  headerSegment: string,
  snRefSegment: string,
  saldoMatch: RegExpMatchArray | null,
): { nominal: number | null; dariSaldoFallback: boolean } {
  // ALPINES PROVIDER-LEVEL RULE: SELAMBU pakai saldo diff (Saldo A - B = C, ambil B)
  // untuk SEMUA jenis transaksi (voucher, pulsa, paket data, ewallet/DANA/GOPAY, dll)
  // Alasan: nominal eksplisit di Alpines tidak termasuk biaya admin, jadi tidak representatif

  // 1. FALLBACK UTAMA (wajib untuk Alpines): angka B dari segmen saldo (Saldo A - B = C)
  // Gunakan validasi matematis untuk menangani format angka tidak konsisten
  if (saldoMatch && saldoMatch[2]) {
    // Coba parse dengan validasi matematis dari teks asli
    const validatedFromSaldo = parseSaldoWithValidationFromMatch(saldoMatch);
    if (validatedFromSaldo !== null) {
      return { nominal: validatedFromSaldo, dariSaldoFallback: true };
    }
    // Fallback ke parsing sederhana jika validasi gagal (misal typo separator seperti 731-423)
    // Tetap pakai potongan sebagai nominal — jangan gagalkan parsing, cukup log warning untuk audit
    const val = parseAngkaIndonesia(saldoMatch[2]);
    if (val > 0) return { nominal: val, dariSaldoFallback: true };
  }

  // 2. Fallback terakhir: jika saldo diff tidak ada sama sekali, coba eksplisit
  // (seharusnya jarang terjadi karena notifikasi Alpines selalu punya saldo)
  // Keyword eksplisit di segmen SN/Ref: NOMINAL:, TOKEN, atau angka di format /-separated
  const nominalLabelMatch = snRefSegment.match(/NOMINAL:\s*([\d.,]+)/i);
  if (nominalLabelMatch) {
    const val = parseAngkaIndonesia(nominalLabelMatch[1]);
    if (val > 0) return { nominal: val, dariSaldoFallback: false };
  }

  // Cek pola TOKEN di header (mis. "TOKEN 100000 PH100...")
  const tokenMatch = headerSegment.match(/^TOKEN\s+([\d.,]+)/i);
  if (tokenMatch) {
    const val = parseAngkaIndonesia(tokenMatch[1]);
    if (val > 0) return { nominal: val, dariSaldoFallback: false };
  }

  // Cek pola /-separated di SN/Ref (mis. GOPAY/Jasmisaputra/100000/...)
  // HANYA jika segmen pertama adalah nama ewallet EKSAKT (tanpa suffix seperti "TOPUP")
  const snRefParts = snRefSegment.split("/").map((s) => s.trim());
  if (snRefParts.length >= 3) {
    const firstSeg = snRefParts[0].toUpperCase();
    const exactEwallet = ["DANA", "GOPAY", "OVO", "SHOPEEPAY", "LINKAJA"];
    const isExact = exactEwallet.some((name) => firstSeg === name);
    if (isExact) {
      // Cari angka yang bukan nomor HP (10-13 digit diawali 08/62)
      for (const part of snRefParts) {
        if (/^[\d.,]{3,6}$/.test(part) && !/^(08|62)\d{8,11}$/.test(part)) {
          const val = parseAngkaIndonesia(part);
          if (val > 0) return { nominal: val, dariSaldoFallback: false };
        }
      }
    }
  }

  // 3. Angka di header sebelum kode produk (sudah ditangani TOKEN di atas)
  // Cek angka eksplisit di awal header
  const headerAngkaMatch = headerSegment.match(/^([\d.,]{3,6})\s+/);
  if (headerAngkaMatch) {
    const val = parseAngkaIndonesia(headerAngkaMatch[1]);
    if (val > 0) return { nominal: val, dariSaldoFallback: false };
  }

  return { nominal: null, dariSaldoFallback: false };
}

/**
 * Parse saldo from RegExpMatchArray with mathematical validation.
 * Uses the same flexible parsing logic as parseSaldoWithValidation.
 */
function parseSaldoWithValidationFromMatch(
  saldoMatch: RegExpMatchArray,
): number | null {
  if (!saldoMatch || saldoMatch.length < 4) return null;

  const saldoAwalRaw = saldoMatch[1];
  const potonganRaw = saldoMatch[2];
  const saldoAkhirRaw = saldoMatch[3];

  // Try different parsing modes to handle inconsistent formats
  const modes: Array<"dot_as_thousand" | "dot_as_decimal" | "no_separator"> = [
    "dot_as_thousand",
    "dot_as_decimal",
    "no_separator",
  ];

  let bestPotongan: number | null = null;

  for (const mode of modes) {
    const saldoAwal = parseAngkaIndonesiaFlexible(saldoAwalRaw, mode);
    const potongan = parseAngkaIndonesiaFlexible(potonganRaw, mode);
    const saldoAkhir = parseAngkaIndonesiaFlexible(saldoAkhirRaw, mode);

    // Validate mathematically: saldo_awal - potongan == saldo_akhir
    // Allow small tolerance for rounding
    if (Math.abs(saldoAwal - potongan - saldoAkhir) < 1) {
      if (potongan > 0) {
        // Prefer larger potongan (more realistic for transaction amounts)
        if (bestPotongan === null || potongan > bestPotongan) {
          bestPotongan = potongan;
        }
      }
    }
  }

  return bestPotongan;
}

/**
 * Parse Indonesian-formatted number string to integer with flexible separator handling.
 * Tries multiple parsing modes to handle inconsistent formats:
 * - "13150" (no separator)
 * - "15.550" (dot as thousand separator)
 * - "52.927" (dot as thousand separator)
 * - "50.650" (dot as thousand separator)
 * - "102.150" (dot as thousand separator)
 * - "100,000" (comma as thousand separator)
 * - "731-423" (dash as thousand separator - typo format)
 */
function parseAngkaIndonesiaFlexible(
  raw: string,
  mode: "dot_as_thousand" | "dot_as_decimal" | "no_separator",
): number {
  let cleaned: string;
  if (mode === "dot_as_thousand") {
    // Dot is thousand separator, remove it. Comma is decimal separator.
    // Also handle dash as thousand separator (typo format like "731-423")
    cleaned = raw.replace(/[.-]/g, "").replace(/,/g, ".");
  } else if (mode === "dot_as_decimal") {
    // Dot is decimal separator, comma is thousand separator (less common in ID)
    // Also handle dash as thousand separator
    cleaned = raw.replace(/[,-]/g, "").replace(/\./g, ".");
  } else {
    // no_separator: just remove all separators (dots, commas, dashes)
    cleaned = raw.replace(/[.,-]/g, "");
  }
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

export function parseAngkaIndonesia(raw: string): number {
  // Remove dots (thousands separator) but keep commas for potential decimals
  // Also handle dash as thousand separator (typo format like "731-423")
  // Then replace comma with dot for parseFloat, or just remove if we want integer
  const cleaned = raw.replace(/[.-]/g, "").replace(/,/g, ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

// ============================================================================
// 6. EKSTRAKSI STATUS UNIVERSAL (Expanded Keywords)
// ============================================================================

const keywordGagal =
  /\b(gagal|failed|ditolak|bermasalah|gangguan|error|tidak dapat diproses|koneksi\s*(terputus|bermasalah|gagal)|timeout|kadaluarsa|expired)\b/i;
const keywordPending =
  /\b(pending|diproses|menunggu|mohon\s*tunggu|sedang\s*(diproses|berlangsung)|silakan\s*tunggu|akan\s*diproses|tunggu\s*sms\s*notifikasi)\b/i;
const keywordSukses =
  /\b(berhasil|sukses|success|telah\s*(dilakukan|selesai))\b/i;

export function extractStatusUniversal(
  rawText: string,
  _jenisTransaksi: string,
  detailTambahan: Record<string, unknown>,
): { status: "sukses" | "gagal" | "pending"; perluReview: boolean } {
  // Explicit detection for Alpines "sedang diproses" placeholder notifications
  // These are VALID pending notifications, not failed parsing
  const keywordSedangDiproses =
    /\b(akan\s*diproses|tunggu\s*sms\s*notifikasi|mohon\s*tunggu|sedang\s*diproses|silakan\s*tunggu)\b/i;
  if (keywordSedangDiproses.test(rawText)) {
    return { status: "pending", perluReview: false }; // valid pending, not a guess
  }

  if (keywordGagal.test(rawText))
    return { status: "gagal", perluReview: false };
  if (keywordPending.test(rawText))
    return { status: "pending", perluReview: false };
  if (keywordSukses.test(rawText))
    return { status: "sukses", perluReview: false };

  // Fallback sinyal implisit sukses — generik, bukan cuma PLN
  const adaReferensiLengkap =
    detailTambahan.id_transaksi != null ||
    detailTambahan.sn != null ||
    detailTambahan.reff != null;
  const frasaKonfirmasi = /anda telah melakukan/i.test(rawText);
  if (adaReferensiLengkap && frasaKonfirmasi) {
    return { status: "sukses", perluReview: false };
  }

  return { status: "pending", perluReview: true };
}

// ============================================================================
// 7. EKSTRAKSI NAMA PRODUK PAKET DATA (Structural Keyword Approach)
// ============================================================================

export function extractNamaProdukPaketData(text: string): string | null {
  // Nama paket selalu berada di antara keyword "paket data" dan keyword "pada" (penanda tanggal)
  const paketDataMatch = text.match(/paket data\s+(.+?)\s+pada\s+\d/i);
  return paketDataMatch?.[1]?.trim() ?? null;
}

// ============================================================================
// 8. DETEKSI NOTIFIKASI PENDING ALPINES (harus diabaikan total)
// ============================================================================

const keywordAlpinesPending =
  /\b(akan\s*diproses|tunggu\s*sms\s*notifikasi|mohon\s*tunggu\s*sebentar)\b/i;

export function apakahNotifikasiPendingAlpines(
  rawText: string,
  provider: string,
): boolean {
  return provider === "alpines" && keywordAlpinesPending.test(rawText);
}
