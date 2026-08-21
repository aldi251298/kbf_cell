/**
 * extractNominal — extract nominal from notification text (Bagian 3.4).
 * Priority order:
 *  1. Rp\s?[\d.,]+
 *  2. NOMINAL:\s*[\d.,]+  (eksplisit, prioritas atas saldo untuk ewallet)
 *  3. Pola SN/Ref: X/Y/angka/nomor_hp/... (untuk ewallet Alpines)
 *  4. Saldo\s*[\d.,]+\s*-\s*[\d.,]+\s*=\s*[\d.,]+  → ambil angka kedua
 *  5. Fallback: angka besar terdekat keyword nominal/senilai/sebesar/Rp
 *
 * For Alpines: uses extractNominalAlpines from universal.ts with priority:
 *  1. Keyword eksplisit di segmen SN/Ref: NOMINAL:, TOKEN, atau angka di format /-separated
 *  2. Angka di header sebelum kode produk
 *  3. FALLBACK TERAKHIR: angka B dari segmen saldo (Saldo A - B = C) — tandai perlu_review
 */

import { parseStrukturAlpines, extractNominalAlpines } from "./universal";

export function extractNominal(
  text: string,
  jenisTransaksi: string,
): number | null {
  const lower = text.toLowerCase();

  // 1. Pola Rp\s?[\d.,]+
  const rpMatch = text.match(/rp\s*([\d.,]+)/i);
  if (rpMatch) {
    const val = parseAngkaIndonesia(rpMatch[1]);
    if (val > 0) return val;
  }

  // 2. Keyword eksplisit NOMINAL: (prioritas atas saldo untuk ewallet)
  const nominalLabelMatch = text.match(/nominal:\s*([\d.,]+)/i);
  if (nominalLabelMatch) {
    const val = parseAngkaIndonesia(nominalLabelMatch[1]);
    if (val > 0) return val;
  }

  // 3. Pola SN/Ref: X/Y/angka/nomor_hp/... (untuk ewallet Alpines)
  // Ambil segmen ke-3 (nominal) jika formatnya 4+ segmen dipisah "/"
  // PRIORITAS: cek ini SEBELUM saldo untuk ewallet (SRS 3.4 poin 3)
  // HANYA jika segmen pertama adalah nama ewallet eksplisit (tanpa suffix seperti "TOPUP")
  if (jenisTransaksi === "ewallet") {
    const snRefMatch = text.match(/sn\/ref:\s*(.+?)(?:\.\s*saldo\s|$)/i);
    if (snRefMatch) {
      const segments = snRefMatch[1].split("/").map((s) => s.trim());
      if (segments.length >= 4) {
        const firstSeg = segments[0].toUpperCase();
        const exactEwallet = ["DANA", "GOPAY", "OVO", "SHOPEEPAY", "LINKAJA"];
        const isExact = exactEwallet.some((name) => firstSeg === name);
        if (isExact) {
          for (const seg of segments) {
            if (/^\d{3,6}$/.test(seg) && !/^0\d{9,12}$/.test(seg)) {
              const val = parseInt(seg, 10);
              if (val > 0) return val;
            }
          }
        }
      }
    }
  }

  // 4. Pola Saldo X - Y = Z → ambil Y (kedua) — fallback untuk ewallet
  const saldoCalcMatch = text.match(/saldo\s*([\d.,]+)\s*-\s*([\d.,]+)\s*=/i);
  if (saldoCalcMatch) {
    const val = parseAngkaIndonesia(saldoCalcMatch[2]);
    if (val > 0) return val;
  }

  // 5. Fallback: angka besar (≥4 digit) terdekat keyword nominal/senilai/sebesar/rp
  const fallbackMatch = lower.match(
    /(?:nominal|senilai|sebesar|rp)\s*[:\s]*([\d.,]+)/,
  );
  if (fallbackMatch) {
    const val = parseAngkaIndonesia(fallbackMatch[1]);
    if (val > 0) return val;
  }

  return null;
}

/**
 * Extract nominal for Alpines using the priority order from Fase 2.3
 * Returns { nominal, dariSaldoFallback } where dariSaldoFallback indicates
 * if the nominal came from saldo fallback (should trigger perlu_review)
 */
export function extractNominalForAlpines(text: string): {
  nominal: number | null;
  dariSaldoFallback: boolean;
} {
  const structure = parseStrukturAlpines(text);
  return extractNominalAlpines(
    text,
    structure.headerSegment,
    structure.snRefSegment,
    structure.saldoMatch,
  );
}

/**
 * Parse Indonesian-formatted number string to integer.
 * Handles: "20000", "20.000", "20,000", "11950", "50.650"
 */
function parseAngkaIndonesia(raw: string): number {
  const cleaned = raw.replace(/\./g, "").replace(/,/g, "");
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}
