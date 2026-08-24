import { parseStrukturAlpines } from "./universal";

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
 * Bersihkan angka dari format Indonesia (hapus titik dan koma)
 */
function bersihkanAngka(str: string): number {
  return parseInt(str.replace(/\./g, "").replace(/,/g, ""), 10);
}

// Pola 1: keyword NOMINAL: eksplisit
const polaNominalEksplisit = /NOMINAL:\s*([\d.,]+)/i;

// Pola 2 (BARU, PENTING): angka 4-7 digit yang muncul TEPAT SEBELUM pola KODE.NOMOR
// Menangkap format seperti: "15000 TSBYU15.085198025507", "30000 AX30.083877750811",
// "TOKEN 20000 PH20.50160790239"
const polaAngkaSebelumKode = /(\d{4,7})\s+[A-Z0-9]{2,15}\.\d{8,13}/i;

function ekstrakDariSegmenSnRef(rawText: string): number | null {
  // Pola 3: segmen posisional di SN/Ref, format X/Y/angka/nomorHP/...
  // mis. "GOPAY/Jasmisaputra/100000/081372331339/REFF:..." -> ambil komponen numerik
  //      yang BUKAN nomor HP (bukan 10-13 digit diawali 08)
  // Coba cari di SN/Ref segment dulu (format dengan prefix "SN/Ref:")
  const snRefMatch = rawText.match(
    /SN\/Ref:?\s*([\s\S]*?)(?=\s*Saldo\s+[\d.,]+)/i,
  );
  let segmenText = snRefMatch ? snRefMatch[1] : null;

  // Jika tidak ada SN/Ref prefix, coba ambil dari header (sebelum "berhasil"/"GAGAL")
  // Format: "DANA TOPUP/MXX INDXXXXXX/50000/081234567890/REFF:12345 berhasil..."
  if (!segmenText) {
    const headerMatch = rawText.match(/^(.*?)\s*(?:Berhasil|GAGAL)\b/i);
    if (headerMatch) {
      segmenText = headerMatch[1].trim();
    }
  }

  if (!segmenText) return null;

  const segmen = segmenText.split("/").map((s) => s.trim());
  for (const s of segmen) {
    const angka = s.replace(/\./g, "");
    if (/^\d{4,7}$/.test(angka) && !/^0[0-9]{9,12}$/.test(angka)) {
      return parseInt(angka, 10);
    }
  }
  return null;
}

export interface HasilNominalDasarAlpines {
  nominalDasar: number;
  sumberDasar:
    | "eksplisit_nominal"
    | "eksplisit_header"
    | "eksplisit_segmen"
    | "fallback_saldo";
}

/**
 * Ekstraksi nominal dasar Alpines dengan urutan prioritas final (Fase 2.7):
 * 1. NOMINAL: eksplisit
 * 2. Angka 4-7 digit sebelum kode transaksi (header)
 * 3. Segmen posisional di SN/Ref
 * 4. Fallback ke potongan saldo (HANYA kalau benar-benar tidak ada sumber eksplisit)
 */
export function ekstraksiNominalDasarAlpines(
  rawText: string,
  potonganSaldo: number,
): HasilNominalDasarAlpines {
  const nominalEksplisit = rawText.match(polaNominalEksplisit);
  if (nominalEksplisit) {
    return {
      nominalDasar: bersihkanAngka(nominalEksplisit[1]),
      sumberDasar: "eksplisit_nominal",
    };
  }

  const angkaSebelumKode = rawText.match(polaAngkaSebelumKode);
  if (angkaSebelumKode) {
    return {
      nominalDasar: bersihkanAngka(angkaSebelumKode[1]),
      sumberDasar: "eksplisit_header",
    };
  }

  const segmenAngka = ekstrakDariSegmenSnRef(rawText);
  if (segmenAngka != null) {
    return { nominalDasar: segmenAngka, sumberDasar: "eksplisit_segmen" };
  }

  // FALLBACK TERAKHIR — hanya kalau benar-benar tidak ada sumber eksplisit
  // (kasus ini terjadi untuk voucher/game top-up yang SN/Ref-nya berupa kode/UUID, bukan angka)
  return { nominalDasar: potonganSaldo, sumberDasar: "fallback_saldo" };
}

/**
 * Extract nominal for Alpines using the new priority order from Fase 2.7
 * Returns { nominalDasar, sumberDasar, nominalFinal, adminKonter }
 */
export function extractNominalForAlpines(text: string): {
  nominalDasar: number | null;
  sumberDasar:
    | "eksplisit_nominal"
    | "eksplisit_header"
    | "eksplisit_segmen"
    | "fallback_saldo"
    | null;
  nominalFinal: number | null;
  adminKonter: number;
  adaAturan: boolean;
} {
  const structure = parseStrukturAlpines(text);

  // Extract saldo to get potonganSaldo for fallback
  let potonganSaldo = 0;
  if (structure.saldoMatch && structure.saldoMatch[2]) {
    potonganSaldo = parseAngkaIndonesia(structure.saldoMatch[2]);
  }

  const hasil = ekstraksiNominalDasarAlpines(text, potonganSaldo);

  // For now, return nominalDasar as nominalFinal (admin konter will be applied later in parser/index.ts)
  return {
    nominalDasar: hasil.nominalDasar,
    sumberDasar: hasil.sumberDasar,
    nominalFinal: hasil.nominalDasar,
    adminKonter: 0,
    adaAturan: false,
  };
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
