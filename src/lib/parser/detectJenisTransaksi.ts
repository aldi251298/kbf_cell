/**
 * detectJenisTransaksi — scoring-based detection (Bagian 3.3).
 * Returns the jenis_transaksi with the highest keyword score.
 * Synchronous version for known categories only.
 * For dynamic categories, use tebakJenisTransaksiUniversal from universal.ts
 */

import { JENIS_TRANSAKSI_KEYWORDS, JENIS_TRANSAKSI_PRIORITY } from "./keywords";

/**
 * Special scoring for paket_nelpon vs paket_data vs pulsa (Fase 2.3.2 Bug 1 fix + new category)
 * - paket_nelpon checked FIRST (higher priority) for nelpon/telepon/talkmania keywords
 * - paket_data no longer requires GB+Hari combination
 * - paket_data gets boosted by "paket" keyword or telco package names
 * - pulsa only if explicit "pulsa" keyword AND no "paket" keyword
 * - NEW (Bug 2 fix): explicit detection for mobile operator + number = pulsa
 */
function scoringPaketAtauPulsa(rawText: string): {
  kategori: string;
  skor: number;
} {
  const adaKataPaket = /\bpaket\b/i.test(rawText);
  const adaNelpon =
    /\b(nelpon|telepon|talkmania|nelpon\s*sms|sms\s*nelpon|kombo\s*nelpon|voice\s*call)\b/i.test(
      rawText,
    );
  const adaData = /\b(paket\s*data|kuota|internet|gb\b|mb\b)\b/i.test(rawText);
  const adaGBHari = /\d+(\.\d+)?\s*(GB|MB)\b.*?\d+\s*(hari|day)/i.test(rawText);
  const adaKataPulsaEksplisit = /\bpulsa\b/i.test(rawText) && !adaKataPaket;

  // Cek nelpon DULU — prioritas lebih tinggi dari paket_data
  if (adaNelpon) {
    return { kategori: "paket_nelpon", skor: 2 };
  }
  if (adaKataPaket && (adaData || adaGBHari)) {
    return { kategori: "paket_data", skor: 2 };
  }
  if (adaKataPaket) {
    // ada kata "paket" tapi tidak jelas nelpon atau data — default ke paket_data,
    // tapi tandai perlu_review supaya bisa dicek manual kalau ternyata kategori baru
    return { kategori: "paket_data", skor: 1 };
  }
  if (adaKataPulsaEksplisit) {
    return { kategori: "pulsa", skor: 1 };
  }

  // Bug 2 fix: Deteksi eksplisit nama operator seluler + angka tanpa "paket"/"data" = pulsa
  // Contoh: "Telkomsel BYU 15000 TSBYU15.085198025507" -> pulsa
  const adaAngkaSetelahOperator =
    /\b(telkomsel|byu|axis|tri|indosat|im3|xl|smartfren)\s+\d{3,6}\b/i;

  if (
    adaAngkaSetelahOperator.test(rawText) &&
    !/\bpaket\b|\bdata\b/i.test(rawText)
  ) {
    return { kategori: "pulsa", skor: 2 };
  }

  return { kategori: "", skor: 0 };
}

export function detectJenisTransaksi(text: string): string {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};

  // Count keyword hits per category
  for (const [kategori, keywords] of Object.entries(JENIS_TRANSAKSI_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      // Count non-overlapping occurrences
      const regex = new RegExp(escapeRegex(kw), "gi");
      const matches = lower.match(regex);
      if (matches) score += matches.length;
    }
    scores[kategori] = score;
  }

  // Special handling for paket_data vs pulsa (Fase 2.3.2)
  const paketPulsaScore = scoringPaketAtauPulsa(text);
  if (paketPulsaScore.kategori) {
    scores[paketPulsaScore.kategori] =
      (scores[paketPulsaScore.kategori] ?? 0) + paketPulsaScore.skor;
  }

  // Pick highest score; break ties by priority order
  let best = "belum_dikenal";
  let bestScore = 0;

  for (const kategori of JENIS_TRANSAKSI_PRIORITY) {
    if ((scores[kategori] ?? 0) > bestScore) {
      bestScore = scores[kategori] ?? 0;
      best = kategori;
    }
  }

  // Check remaining categories not in priority list
  for (const [kategori, score] of Object.entries(scores)) {
    if (!JENIS_TRANSAKSI_PRIORITY.includes(kategori) && score > bestScore) {
      bestScore = score;
      best = kategori;
    }
  }

  return best;
}

// Export scoring function for use by tebakJenisTransaksiUniversal
export async function scoringKeywordKategori(
  rawText: string,
): Promise<{ kategori: string; skor: number }> {
  const scores: Record<string, number> = {};

  for (const [kategori, keywords] of Object.entries(JENIS_TRANSAKSI_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      const regex = new RegExp(escapeRegex(kw), "gi");
      const matches = rawText.match(regex);
      if (matches) score += matches.length;
    }
    scores[kategori] = score;
  }

  // Special handling for paket_data vs pulsa (Fase 2.3.2)
  const paketPulsaScore = scoringPaketAtauPulsa(rawText);
  if (paketPulsaScore.kategori) {
    scores[paketPulsaScore.kategori] =
      (scores[paketPulsaScore.kategori] ?? 0) + paketPulsaScore.skor;
  }

  let best = "belum_dikenal";
  let bestScore = 0;

  for (const kategori of JENIS_TRANSAKSI_PRIORITY) {
    if ((scores[kategori] ?? 0) > bestScore) {
      bestScore = scores[kategori] ?? 0;
      best = kategori;
    }
  }

  for (const [kategori, score] of Object.entries(scores)) {
    if (!JENIS_TRANSAKSI_PRIORITY.includes(kategori) && score > bestScore) {
      bestScore = score;
      best = kategori;
    }
  }

  return { kategori: best, skor: bestScore };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
