import { parseStrukturAlpines, extractNominalAlpines } from "./universal";

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
export function parseAngkaIndonesiaFlexible(
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

/**
 * Try to parse saldo pattern with mathematical validation.
 * Returns the validated potongan (middle number) or null if validation fails.
 */
export function parseSaldoWithValidation(text: string): number | null {
  // Match: Saldo <awal> - <potongan> = <akhir>
  // Updated: [\d.,-]+ to handle dashes as thousand separators (e.g., "731-423")
  const match = text.match(
    /saldo\s*([\d.,-]+)\s*-\s*([\d.,-]+)\s*=\s*([\d.,-]+)/i,
  );
  if (!match) return null;

  const [, saldoAwalRaw, potonganRaw, saldoAkhirRaw] = match;

  // Try different parsing modes to handle inconsistent formats
  const modes: Array<"dot_as_thousand" | "dot_as_decimal" | "no_separator"> = [
    "dot_as_thousand",
    "dot_as_decimal",
    "no_separator",
  ];

  for (const mode of modes) {
    const saldoAwal = parseAngkaIndonesiaFlexible(saldoAwalRaw, mode);
    const potongan = parseAngkaIndonesiaFlexible(potonganRaw, mode);
    const saldoAkhir = parseAngkaIndonesiaFlexible(saldoAkhirRaw, mode);

    // Validate mathematically: saldo_awal - potongan == saldo_akhir
    // Allow small tolerance for rounding
    if (Math.abs(saldoAwal - potongan - saldoAkhir) < 1) {
      if (potongan > 0) return potongan;
    }
  }

  return null;
}

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
            if (/^[\d.,]{3,6}$/.test(seg) && !/^0\d{9,12}$/.test(seg)) {
              const val = parseAngkaIndonesia(seg);
              if (val > 0) return val;
            }
          }
        }
      }
    }
  }

  // 3b. Pola nominal eksplisit di header (untuk Digipos pulsa/paket_data/voucher)
  // Format: "Telkomsel 25000 KODE..." atau "Voucher Three 50000 KODE..."
  // Hanya untuk jenis transaksi yang biasanya punya nominal eksplisit di header
  // TIDAK untuk format "Telkomsel BYU 15000 KODE..." di mana 15000 adalah denom produk, bukan nominal transaksi
  if (["pulsa", "paket_data", "voucher"].includes(jenisTransaksi)) {
    // Cari angka 3-6 digit di header sebelum kode transaksi (alfanumerik + titik + angka)
    // Pola: ... angka 3-6 digit -> kode transaksi (contoh: TSBYU15.085198025507, VTR10.0895)
    // Match: "Telkomsel 25000 TSBYU15..." atau "Voucher Three 50000 VTR10..."
    // TIDAK match: "Telkomsel BYU 15000 TSBYU15..." karena "BYU" adalah kode produk (2-4 huruf besar)
    // sebelum nominal, yang menandakan ini adalah denomination, bukan nominal transaksi
    const headerNominalMatch = text.match(
      /([\d.,]{3,6})\s+[A-Z0-9]{3,15}\.\d{4,13}/i,
    );
    if (headerNominalMatch) {
      // Cek apakah kata sebelum nominal adalah kode produk pendek (2-4 huruf besar seperti BYU, VTR, dll)
      // Jika ya, ini adalah denomination produk, bukan nominal transaksi
      const beforeNominal = text.slice(0, headerNominalMatch.index);
      const lastWordBeforeNominal =
        beforeNominal.trim().split(/\s+/).pop() || "";
      const isProductCode = /^[A-Z]{2,4}$/.test(lastWordBeforeNominal);
      if (!isProductCode) {
        const val = parseAngkaIndonesia(headerNominalMatch[1]);
        if (val > 0) return val;
      }
    }
    // Fallback: angka 3-6 digit di awal teks (sebelum spasi dan kata berikutnya)
    // Hanya jika teks dimulai dengan angka (bukan nama produk)
    const headerNominalMatch2 = text.match(/^([\d.,]{3,6})\s+/);
    if (headerNominalMatch2) {
      const val = parseAngkaIndonesia(headerNominalMatch2[1]);
      if (val > 0) return val;
    }
  }

  // 4. Pola Saldo X - Y = Z → ambil Y (kedua) — fallback dengan validasi matematis
  const saldoValidated = parseSaldoWithValidation(text);
  if (saldoValidated !== null) {
    return saldoValidated;
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
 * Handles: "20000", "20.000", "20,000", "11950", "50.650", "731-423"
 * Indonesian format uses dot (.) as thousands separator and comma (,) as decimal separator.
 * For rupiah (whole numbers), we remove dots and dashes only.
 * Also handles dash as thousand separator (typo format like "731-423")
 */
export function parseAngkaIndonesia(raw: string): number {
  // Remove dots and dashes (thousands separator) but keep commas for potential decimals
  // Also handle dash as thousand separator (typo format like "731-423")
  // Then replace comma with dot for parseFloat, or just remove if we want integer
  const cleaned = raw.replace(/[.-]/g, "").replace(/,/g, ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}
