/**
 * extractNamaProduk — extract nama_produk based on jenis_transaksi (Bagian 3.8b, 3.8c).
 * Updated for Fase 2.3: paket_data uses structural keyword approach.
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
      // Use structural keyword approach: between "paket data" and "pada"
      return extractNamaProdukPaketData(text);
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

    default:
      return null;
  }
}
