"use strict";
/**
 * extractNamaProduk — extract nama_produk based on jenis_transaksi (Bagian 3.8b, 3.8c).
 * Updated for Fase 2.3: paket_data uses structural keyword approach.
 * Updated for Fase 2.3.2: handle Alpines voucher format for paket_data.
 * Updated for Fase 2.3.3: Digipos voucher uses string slicing approach (Bug 1 fix).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractNamaProdukVoucherDigipos = extractNamaProdukVoucherDigipos;
exports.extractNamaProduk = extractNamaProduk;
const keywords_1 = require("./keywords");
const universal_1 = require("./universal");
/**
 * Extract nama produk for Digipos voucher format using string slicing approach.
 * More robust than regex because it doesn't depend on text after phone number.
 *
 * Example: "Isi ulang paket Combo Sakti 6281266562888 pd..."
 * -> finds "paket " -> slices after it -> "Combo Sakti 6281266562888 pd..."
 * -> finds phone number -> slices before it -> "Combo Sakti"
 */
function extractNamaProdukVoucherDigipos(rawText) {
    const startMarker = rawText.match(/isi ulang paket\s+/i);
    if (!startMarker)
        return null;
    const startIdx = startMarker.index + startMarker[0].length;
    const sisaTeks = rawText.slice(startIdx);
    // Cari nomor HP (08xxx atau 62xxx, 10-13 digit) sebagai penanda AKHIR nama produk
    const phoneMatch = sisaTeks.match(/\b(?:62|08)\d{8,11}\b/);
    if (!phoneMatch)
        return null;
    const endIdx = startIdx + phoneMatch.index;
    return rawText.slice(startIdx, endIdx).trim();
}
function extractNamaProduk(text, jenisTransaksi, ewalletName) {
    switch (jenisTransaksi) {
        case "voucher_data_alpines": {
            // Alpines voucher format: "Voucher <nama> <specs> *xxx*... Berhasil. SN/Ref: ... Saldo ..."
            // Extract nama produk between "Voucher" and the first asterisk pattern or "Berhasil"/"Gagal"
            let cleaned = text
                .replace(/\*\d+\*.*$/i, "") // remove "*838*..." and everything after
                .replace(/nomor\s*voucher#.*$/i, ""); // remove "nomor voucher#..." and everything after
            // Remove trailing status words
            cleaned = cleaned.replace(/\s+(Berhasil|Gagal)$/i, "").trim();
            // Extract the part after "Voucher" (case insensitive)
            const voucherMatch = cleaned.match(/Voucher\s+(.+)/i);
            if (voucherMatch) {
                return voucherMatch[1].trim();
            }
            return null;
        }
        case "paket_data": {
            // First try structural keyword approach: between "paket data" and "pada"
            const paketDataResult = (0, universal_1.extractNamaProdukPaketData)(text);
            if (paketDataResult)
                return paketDataResult;
            // Fallback for Digipos voucher format: "Isi ulang paket <nama> <nomor> pd..."
            const digiposResult = extractNamaProdukVoucherDigipos(text);
            if (digiposResult)
                return digiposResult;
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
            const voucherMatch = text.match(/VOUCHER\s+([a-zA-Z0-9][a-zA-Z0-9\s]*?)(?:\s+\d|$)/i);
            if (voucherMatch) {
                return voucherMatch[1].trim();
            }
            return null;
        }
        case "ewallet": {
            // Normalisasi nama e-wallet
            if (ewalletName) {
                const normalized = keywords_1.EWALLET_NORMALIZATION[ewalletName.toLowerCase()];
                if (normalized)
                    return normalized;
                // Capitalize first letter as fallback
                return (ewalletName.charAt(0).toUpperCase() +
                    ewalletName.slice(1).toLowerCase());
            }
            return null;
        }
        case "paket_nelpon": {
            // Use string slicing approach for Digipos voucher format (Bug 1 fix)
            // This handles: "Isi ulang paket Combo Sakti 6281266562888 pd..."
            // and "Isi ulang paket Super Seru Internet 6282382402102 pd..."
            const digiposResult = extractNamaProdukVoucherDigipos(text);
            if (digiposResult)
                return digiposResult;
            return null;
        }
        case "game_topup": {
            // Extract game name from text
            const gameMatch = text.match(/\b(FREE\s?FIRE|MOBILE\s?LEGENDS|PUBG|VALORANT|GENSHIN)\b/i);
            if (gameMatch) {
                return gameMatch[0].toUpperCase();
            }
            return null;
        }
        case "pln": {
            // For PLN token format: "TOKEN <nominal> PH..." -> return "PLN"
            // For other PLN formats, return "PLN" as default
            return "PLN";
        }
        default:
            return null;
    }
}
