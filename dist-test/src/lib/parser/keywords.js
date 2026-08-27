"use strict";
/**
 * Keyword definitions for the centralized parser (Fase 2.2 & 2.3).
 * Used for scoring-based detection of jenis_transaksi and provider_seluler.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EWALLET_NORMALIZATION = exports.PROVIDER_SELULER_PREFIXES = exports.PROVIDER_SELULER_KEYWORDS = exports.STATUS_KEYWORDS = exports.JENIS_TRANSAKSI_PRIORITY = exports.JENIS_TRANSAKSI_KEYWORDS = void 0;
// ---------------------------------------------------------------------------
// Jenis transaksi keywords (Bagian 3.3 + Fase 2.3 expansions)
// ---------------------------------------------------------------------------
exports.JENIS_TRANSAKSI_KEYWORDS = {
    pulsa: ["isi ulang pulsa", "isi ulang", "pulsa", "reguler"],
    paket_nelpon: [
        "nelpon",
        "telepon",
        "talkmania",
        "nelpon sms",
        "sms nelpon",
        "kombo nelpon",
        "voice call",
    ],
    paket_data: [
        "paket data",
        "paket",
        "kuota",
        "internet",
        "voucher senilai",
        "voucher internet",
        "voucher data",
        "voucher",
    ],
    pln: [
        "pln",
        "token listrik",
        "stroom",
        "meter",
        "pembayaran pln",
        "token pln prabayar",
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
    // Fase 2.3 - New transaction types
    game_topup: [
        "free fire",
        "mobile legends",
        "pubg",
        "valorant",
        "genshin",
        "diamond ff",
        "diamond ml",
        "diamond mobile",
        "garena",
        "steam wallet",
        "top up game",
        "topup game",
    ],
    wifi: ["wifi", "indihome", "internet rumah", "broadband"],
    tv_kabel: [
        "tv kabel",
        "indovision",
        "transvision",
        "k-vision",
        "nex parabola",
    ],
    pdam: ["pdam", "air minum", "tagihan air"],
    token_listrik_reseller: ["token ph", "token listrik reseller"],
    // BUG 3: Tagihan Telkom/Indihome
    tagihan: [
        "bayar tagihan telkom",
        "bayar tagihan indihome",
        "tagihan telkom",
        "tagihan indihome",
        "bayar tagihan",
    ],
};
// Priority order for disambiguation (higher = checked first)
// New categories added before generic ones
exports.JENIS_TRANSAKSI_PRIORITY = [
    "ewallet",
    "pln",
    "token_listrik_reseller",
    "game_topup",
    "wifi",
    "tv_kabel",
    "pdam",
    "tagihan", // BUG 3: Tagihan Telkom/Indihome - check before generic
    "paket_nelpon",
    "paket_data",
    "pulsa",
];
// ---------------------------------------------------------------------------
// Status keywords (Bagian 3.6) - EXPANDED for Fase 2.3
// ---------------------------------------------------------------------------
exports.STATUS_KEYWORDS = {
    sukses: [
        "berhasil",
        "sukses",
        "success",
        "telah dilakukan",
        "telah selesai",
    ],
    gagal: [
        "gagal",
        "failed",
        "ditolak",
        "bermasalah",
        "gangguan",
        "error",
        "tidak dapat diproses",
        "koneksi terputus",
        "koneksi bermasalah",
        "koneksi gagal",
        "timeout",
        "kadaluarsa",
        "expired",
    ],
    pending: [
        "pending",
        "diproses",
        "menunggu",
        "mohon tunggu",
        "sedang diproses",
        "sedang berlangsung",
        "silakan tunggu",
        "akan diproses",
        "tunggu sms notifikasi",
    ],
};
// ---------------------------------------------------------------------------
// Provider seluler keywords (Bagian 3.8a)
// ---------------------------------------------------------------------------
exports.PROVIDER_SELULER_KEYWORDS = {
    Telkomsel: ["telkomsel", "simpati", " as ", "byu", "byU"],
    Axis: ["axis"],
    Tri: ["tri", " 3 "],
    Indosat: ["indosat", "im3", "mentari"],
    XL: ["xl"],
};
// Prefix fallback for provider seluler detection
exports.PROVIDER_SELULER_PREFIXES = {
    Telkomsel: [
        "0811",
        "0812",
        "0813",
        "0821",
        "0822",
        "0823",
        "0851",
        "0852",
        "0853",
        "0838",
    ],
    Axis: ["0838", "0831", "0832", "0833"],
    Tri: ["0895", "0896", "0897", "0898", "0899"],
    Indosat: ["0855", "0856", "0857", "0858", "0814", "0815"],
    XL: ["0817", "0818", "0819", "0859", "0877", "0878"],
};
// ---------------------------------------------------------------------------
// E-wallet name normalization (Bagian 3.8c)
// ---------------------------------------------------------------------------
exports.EWALLET_NORMALIZATION = {
    dana: "DANA",
    gopay: "GoPay",
    "go-pay": "GoPay",
    ovo: "OVO",
    shopeepay: "ShopeePay",
    linkaja: "LinkAja",
};
