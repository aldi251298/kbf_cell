/**
 * detectJenisTransaksi � scoring-based detection (Bagian 3.3).
 * Returns the jenis_transaksi with the highest keyword score.
 */

import { JENIS_TRANSAKSI_KEYWORDS, JENIS_TRANSAKSI_PRIORITY } from "./keywords";

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

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}