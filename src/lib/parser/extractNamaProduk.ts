/**
 * extractNamaProduk — extract nama_produk based on jenis_transaksi (Bagian 3.8b, 3.8c).
 */

import { EWALLET_NORMALIZATION } from "./keywords";

export function extractNamaProduk(
  text: string,
  jenisTransaksi: string,
  ewalletName: string | null,
): string | null {
  switch (jenisTransaksi) {
    case "paket_data": {
      // Cari pola [huruf/angka] GB/MB [angka] Hari — tangkap sampai akhir string atau tanda baca berikutnya
      // Gunakan greedy match untuk menangkap duplikasi seperti "28 Hari 28 Hari"
      const paketMatch = text.match(
        /(?:transaksi\s+pengisian\s+paket\s+data\s+)?(?:VOUCHER\s+)?([a-zA-Z0-9][a-zA-Z0-9\s]*?\d+(?:\.\d+)?\s*(?:GB|MB|gb|mb)[\s\S]*?\d+\s*(?:Hari|hari|HARI)(?:\s+\d+\s*(?:Hari|hari|HARI))?)/i,
      );
      if (paketMatch) {
        return paketMatch[1].trim();
      }
      return null;
    }

    case "voucher": {
      // Untuk voucher Alpines, ambil nama produk setelah keyword VOUCHER
      const voucherMatch = text.match(/VOUCHER\s+([a-zA-Z0-9][a-zA-Z0-9\s]*?)(?:\s+\d|$)/i);
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
        return ewalletName.charAt(0).toUpperCase() + ewalletName.slice(1).toLowerCase();
      }
      return null;
    }

    default:
      return null;
  }
}