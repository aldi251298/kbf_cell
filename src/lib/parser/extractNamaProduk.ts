/**
 * extractNamaProduk — extract nama_produk based on jenis_transaksi (Bagian 3.8b, 3.8c).
 * Updated for Fase 2.3: paket_data uses structural keyword approach.
 * Updated for Fase 2.3.2: handle Alpines voucher format for paket_data.
 */

import { EWALLET_NORMALIZATION } from "./keywords";
import { extractNamaProdukPaketData } from "./universal";

export function extractNamaProduk(
  text: string,
  jenisTransaksi: string,
  ewalletName: string | null,
): string | null {
  switch (jenisTransaksi) {
    case "paket_data": {
      // First try structural keyword approach: between "paket data" and "pada"
      const paketDataResult = extractNamaProdukPaketData(text);
      if (paketDataResult) return paketDataResult;

      // Fallback for Alpines voucher format: "VOUCHER <nama> <specs>"
      // Clean the text from voucher code patterns (with or without asterisks) and then extract after VOUCHER
      let cleaned = text
        .replace(/\*\d+\*.*$/i, "") // remove "*838*..." and everything after
        .replace(/nomor\s*voucher#.*$/i, ""); // remove "nomor voucher#..." and everything after

      // Now, if there's a voucher code pattern without asterisks, we might have left some spaces? Trim.
      cleaned = cleaned.trim();

      // Remove trailing status words
      cleaned = cleaned.replace(/\s+(Berhasil|Gagal)$/i, "").trim();

      // Extract the part after "VOUCHER"
      const voucherMatch = cleaned.match(/VOUCHER\s+(.+)/i);
      if (voucherMatch) {
        return voucherMatch[1].trim();
      }

      return null;
    }

    case "voucher": {
      // Untuk voucher Alpines, ambil nama produk setelah keyword VOUCHER
      const voucherMatch = text.match(
        /VOUCHER\s+([a-zA-Z0-9][a-zA-Z0-9\s]*?)(?:\s+\d|$)/i,
      );
      if (voucherMatch) {
        return voucherMatch[1].trim();
      }
      return null;
    }

    case "ewallet": {
      // Normalisasi nama e-wallet
      if (ewalletName) {
        const normalized = EWALLET_NORMALIZATION[ewalletName.toLowerCase()];
        if (normalized) return normalized;
        // Capitalize first letter as fallback
        return (
          ewalletName.charAt(0).toUpperCase() +
          ewalletName.slice(1).toLowerCase()
        );
      }
      return null;
    }

    case "paket_nelpon": {
      // Pattern for Talkmania-like paket nelpon: "isi ulang paket <nama> <nomor> pd"
      const polaPaketNelponVoucher =
        /isi ulang paket\s+(.+?)\s+(?:62\d{8,11}|08\d{8,11})\s+pd/i;
      const namaProdukAlt = text.match(polaPaketNelponVoucher)?.[1]?.trim();
      if (namaProdukAlt) {
        return namaProdukAlt;
      }
      return null;
    }

    case "game_topup": {
      // Extract game name from text
      const gameMatch = text.match(
        /\b(FREE\s?FIRE|MOBILE\s?LEGENDS|PUBG|VALORANT|GENSHIN)\b/i,
      );
      if (gameMatch) {
        return gameMatch[0].toUpperCase();
      }
      return null;
    }

    default:
      return null;
  }
}
