/**
 * Keyword definitions for the centralized parser (Fase 2.2).
 * Used for scoring-based detection of jenis_transaksi and provider_seluler.
 */

// ---------------------------------------------------------------------------
// Jenis transaksi keywords (Bagian 3.3)
// ---------------------------------------------------------------------------
export const JENIS_TRANSAKSI_KEYWORDS: Record<string, string[]> = {
  pulsa: [
    "isi ulang pulsa",
    "isi ulang",
    "pulsa",
  ],
  paket_data: [
    "paket data",
    "voucher",
    "gb",
    "mb",
    "hari",
  ],
  pln: [
    "pln",
    "token listrik",
    "stroom",
    "meter",
    "pembayaran pln",
  ],
  ewallet: [
    "dana",
    "gopay",
    "go-pay",
    "ovo",
    "shopeepay",
    "linkaja",
    "saldo dana",
    "saldo gopay",
  ],
};

// Priority order for disambiguation (higher = checked first)
export const JENIS_TRANSAKSI_PRIORITY = ["ewallet", "pln", "paket_data", "pulsa"];

// ---------------------------------------------------------------------------
// Status keywords (Bagian 3.6)
// ---------------------------------------------------------------------------
export const STATUS_KEYWORDS: Record<"sukses" | "gagal" | "pending", string[]> = {
  sukses: ["berhasil", "sukses", "success"],
  gagal: ["gagal", "failed", "ditolak"],
  pending: ["pending", "diproses", "menunggu"],
};

// ---------------------------------------------------------------------------
// Provider seluler keywords (Bagian 3.8a)
// ---------------------------------------------------------------------------
export const PROVIDER_SELULER_KEYWORDS: Record<string, string[]> = {
  Telkomsel: ["telkomsel", "simpati", " as ", "byu", "byU"],
  Axis: ["axis"],
  Tri: ["tri", " 3 "],
  Indosat: ["indosat", "im3", "mentari"],
  XL: ["xl"],
};

// Prefix fallback for provider seluler detection
export const PROVIDER_SELULER_PREFIXES: Record<string, string[]> = {
  Telkomsel: ["0811", "0812", "0813", "0821", "0822", "0823", "0851", "0852", "0853", "0838"],
  Axis: ["0838", "0831", "0832", "0833"],
  Tri: ["0895", "0896", "0897", "0898", "0899"],
  Indosat: ["0855", "0856", "0857", "0858", "0814", "0815"],
  XL: ["0817", "0818", "0819", "0859", "0877", "0878"],
};

// ---------------------------------------------------------------------------
// E-wallet name normalization (Bagian 3.8c)
// ---------------------------------------------------------------------------
export const EWALLET_NORMALIZATION: Record<string, string> = {
  dana: "DANA",
  gopay: "GoPay",
  "go-pay": "GoPay",
  ovo: "OVO",
  shopeepay: "ShopeePay",
  linkaja: "LinkAja",
};