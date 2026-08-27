"use strict";
/**
 * Parser Terpusat — Entry Point (Bagian 3).
 *
 * parseNotifikasi(provider, rawText) mengembalikan ParsedTransaksi lengkap.
 * Prinsip: setiap field diekstrak independen, transaksi tidak pernah ditolak.
 * Updated for Fase 2.7: Nominal dasar Alpines + Admin Konter system.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.terapkanAdminKonter = exports.tryParseAlpinesTagihanTelkom = exports.extractNominalForAlpines = exports.apakahNotifikasiPendingAlpines = exports.normalisasiWhitespace = exports.parseStrukturAlpines = exports.tebakJenisTransaksiUniversal = exports.apakahTransaksiPelanggan = exports.pisahkanSaldoAplikasi = exports.extractWaktuOpsional = exports.extractDetailTambahan = exports.extractNamaProduk = exports.extractProviderSeluler = exports.extractStatus = exports.extractNomorTujuan = exports.extractNominal = exports.detectJenisTransaksi = void 0;
exports.parseNotifikasi = parseNotifikasi;
exports.parseNotifikasiUniversal = parseNotifikasiUniversal;
const detectJenisTransaksi_1 = require("./detectJenisTransaksi");
const extractNominal_1 = require("./extractNominal");
const extractNomorTujuan_1 = require("./extractNomorTujuan");
const extractProviderSeluler_1 = require("./extractProviderSeluler");
const extractNamaProduk_1 = require("./extractNamaProduk");
const extractDetailTambahan_1 = require("./extractDetailTambahan");
const extractWaktuOpsional_1 = require("./extractWaktuOpsional");
const universal_1 = require("./universal");
const extractNominal_2 = require("./extractNominal");
const extractNominal_3 = require("./extractNominal");
const adminKonter_1 = require("./adminKonter");
var detectJenisTransaksi_2 = require("./detectJenisTransaksi");
Object.defineProperty(exports, "detectJenisTransaksi", { enumerable: true, get: function () { return detectJenisTransaksi_2.detectJenisTransaksi; } });
var extractNominal_4 = require("./extractNominal");
Object.defineProperty(exports, "extractNominal", { enumerable: true, get: function () { return extractNominal_4.extractNominal; } });
var extractNomorTujuan_2 = require("./extractNomorTujuan");
Object.defineProperty(exports, "extractNomorTujuan", { enumerable: true, get: function () { return extractNomorTujuan_2.extractNomorTujuan; } });
var extractStatus_1 = require("./extractStatus");
Object.defineProperty(exports, "extractStatus", { enumerable: true, get: function () { return extractStatus_1.extractStatus; } });
var extractProviderSeluler_2 = require("./extractProviderSeluler");
Object.defineProperty(exports, "extractProviderSeluler", { enumerable: true, get: function () { return extractProviderSeluler_2.extractProviderSeluler; } });
var extractNamaProduk_2 = require("./extractNamaProduk");
Object.defineProperty(exports, "extractNamaProduk", { enumerable: true, get: function () { return extractNamaProduk_2.extractNamaProduk; } });
var extractDetailTambahan_2 = require("./extractDetailTambahan");
Object.defineProperty(exports, "extractDetailTambahan", { enumerable: true, get: function () { return extractDetailTambahan_2.extractDetailTambahan; } });
var extractWaktuOpsional_2 = require("./extractWaktuOpsional");
Object.defineProperty(exports, "extractWaktuOpsional", { enumerable: true, get: function () { return extractWaktuOpsional_2.extractWaktuOpsional; } });
var universal_2 = require("./universal");
Object.defineProperty(exports, "pisahkanSaldoAplikasi", { enumerable: true, get: function () { return universal_2.pisahkanSaldoAplikasi; } });
Object.defineProperty(exports, "apakahTransaksiPelanggan", { enumerable: true, get: function () { return universal_2.apakahTransaksiPelanggan; } });
Object.defineProperty(exports, "tebakJenisTransaksiUniversal", { enumerable: true, get: function () { return universal_2.tebakJenisTransaksiUniversal; } });
Object.defineProperty(exports, "parseStrukturAlpines", { enumerable: true, get: function () { return universal_2.parseStrukturAlpines; } });
Object.defineProperty(exports, "normalisasiWhitespace", { enumerable: true, get: function () { return universal_2.normalisasiWhitespace; } });
Object.defineProperty(exports, "apakahNotifikasiPendingAlpines", { enumerable: true, get: function () { return universal_2.apakahNotifikasiPendingAlpines; } });
var extractNominal_5 = require("./extractNominal");
Object.defineProperty(exports, "extractNominalForAlpines", { enumerable: true, get: function () { return extractNominal_5.extractNominalForAlpines; } });
var extractNominal_6 = require("./extractNominal");
Object.defineProperty(exports, "tryParseAlpinesTagihanTelkom", { enumerable: true, get: function () { return extractNominal_6.tryParseAlpinesTagihanTelkom; } });
var adminKonter_2 = require("./adminKonter");
Object.defineProperty(exports, "terapkanAdminKonter", { enumerable: true, get: function () { return adminKonter_2.terapkanAdminKonter; } });
/**
 * Main parsing function - synchronous version for known categories only.
 * For full dynamic category support, use parseNotifikasiUniversal (async).
 */
function parseNotifikasi(options) {
    const { provider, rawText } = options;
    // 0. Normalisasi whitespace SEBELUM semua ekstraksi (Bug 5 fix)
    // Gunakan versi ternormalisasi untuk SEMUA proses ekstraksi field,
    // tapi raw_notification_text yang disimpan ke DB tetap versi ASLI
    const text = (0, universal_1.normalisasiWhitespace)(rawText);
    // Langkah 1 (revisi): Deteksi Voucher Data Alpines berdasarkan keyword di awal teks
    // Cek pada teks asli (rawText) sebelum normalisasi untuk deteksi paling murni
    const isVoucherDataAlpines = provider === "alpines" && /^\s*Voucher\b/i.test(rawText);
    // 1. Deteksi jenis transaksi (synchronous, known categories only)
    const jenisTransaksi = isVoucherDataAlpines
        ? "voucher_data_alpines"
        : (0, detectJenisTransaksi_1.detectJenisTransaksi)(text);
    // 2. Extract detailTambahan (without alasanReview) for status extraction
    const detailTambahanForStatus = (0, extractDetailTambahan_1.extractDetailTambahan)(text, jenisTransaksi, null);
    // 3. Extract status using extractStatusUniversal
    const { status, perluReview: perluReviewStatus } = (0, universal_1.extractStatusUniversal)(text, jenisTransaksi, detailTambahanForStatus ?? {});
    // 4. Extract nomor tujuan
    const nomorTujuan = (0, extractNomorTujuan_1.extractNomorTujuan)(text, jenisTransaksi);
    // 5. Extract provider seluler (only for pulsa)
    const providerSeluler = jenisTransaksi === "pulsa"
        ? (0, extractProviderSeluler_1.extractProviderSeluler)(text, nomorTujuan)
        : null;
    // 6. Detect e-wallet name for nama_produk
    const ewalletName = detectEwalletName(text);
    // 7. Extract nama produk
    const namaProduk = (0, extractNamaProduk_1.extractNamaProduk)(text, jenisTransaksi, ewalletName);
    // 8. Extract nama pemilik
    const namaPemilik = extractNamaPemilik(text);
    // 9. Extract nominal
    let nominal = null;
    let nominalDasar = null;
    let sumberDasar = null;
    let adminKonter = 0;
    let tagihanData = null;
    // BUG 3: Special handling for "tagihan" (Bayar Tagihan Telkom/Indihome) via Alpines
    // Call specific parser BEFORE generic Alpines parser
    if (provider === "alpines" && jenisTransaksi === "tagihan") {
        tagihanData = (0, extractNominal_3.tryParseAlpinesTagihanTelkom)(text);
        if (tagihanData) {
            nominalDasar = tagihanData.nominalDasar;
            sumberDasar = tagihanData.sumberDasar;
            // Apply admin konter fee for tagihan (same tier as PLN)
            const adminResult = (0, adminKonter_1.terapkanAdminKonter)(nominalDasar, jenisTransaksi, namaProduk);
            nominal = adminResult.nominalFinal;
            adminKonter = adminResult.adminKonter;
        }
    }
    if (nominalDasar === null) {
        if (provider === "alpines") {
            const nominalResult = (0, extractNominal_3.extractNominalForAlpines)(text);
            nominalDasar = nominalResult.nominalDasar;
            sumberDasar = nominalResult.sumberDasar;
            // Apply admin konter fee (jenisTransaksi sudah ditentukan di awal, termasuk voucher_data_alpines)
            const adminResult = (0, adminKonter_1.terapkanAdminKonter)(nominalDasar, jenisTransaksi, namaProduk);
            nominal = adminResult.nominalFinal;
            adminKonter = adminResult.adminKonter;
        }
        else {
            nominalDasar = (0, extractNominal_1.extractNominal)(text, jenisTransaksi);
            // Apply admin konter fee for Digipos too
            const adminResult = (0, adminKonter_1.terapkanAdminKonter)(nominalDasar, jenisTransaksi, namaProduk);
            nominal = adminResult.nominalFinal;
            adminKonter = adminResult.adminKonter;
        }
    }
    // 10. Extract waktu opsional (hanya untuk referensi, tidak disimpan sebagai waktu_transaksi)
    (0, extractWaktuOpsional_1.extractWaktuOpsional)(text);
    // 11. Compute alasan review
    const alasanReview = computeAlasanReview({
        jenisTransaksi,
        nominal,
        nomorTujuan,
        status,
    });
    // 12. Detail tambahan lengkap (tambahkan alasan review jika ada)
    const detailTambahan = { ...detailTambahanForStatus };
    if (alasanReview && detailTambahan) {
        detailTambahan.alasan_review = alasanReview;
    }
    // Fase 2.7: Add nominal_dasar, sumber_nominal_dasar, admin_konter
    if (nominalDasar !== null) {
        detailTambahan.nominal_dasar = nominalDasar;
    }
    if (sumberDasar) {
        detailTambahan.sumber_nominal_dasar = sumberDasar;
    }
    // Always include admin_konter (even 0) for audit trail
    detailTambahan.admin_konter = adminKonter;
    // Add tagihan-specific fields if available
    if (tagihanData) {
        detailTambahan.nomor_pelanggan = tagihanData.nomorTujuan;
        detailTambahan.nama_pemilik_tagihan = tagihanData.namaPemilik;
        detailTambahan.periode_tagihan = tagihanData.periodeTagihan;
        detailTambahan.admin_telkom = tagihanData.adminTelkom;
    }
    // Add saldo_konter object for Alpines
    if (provider === "alpines") {
        const structure = (0, universal_1.parseStrukturAlpines)(text);
        if (structure.saldoMatch) {
            const saldoAwal = (0, extractNominal_2.parseAngkaIndonesia)(structure.saldoMatch[1]);
            const potongan = (0, extractNominal_2.parseAngkaIndonesia)(structure.saldoMatch[2]);
            const saldoAkhir = (0, extractNominal_2.parseAngkaIndonesia)(structure.saldoMatch[3]);
            detailTambahan.saldo_konter = {
                sebelum: saldoAwal,
                terpakai: potongan,
                sesudah: saldoAkhir,
            };
        }
    }
    // 13. ID transaksi — gunakan kombinasi provider + hash teks agar stabil
    const id_transaksi_provider = computeStableId(provider, text);
    // 14. Sanity check — tandai perlu_review jika ada masalah
    const perluReview = alasanReview !== null ||
        (provider === "alpines" && sumberDasar === "fallback_saldo") ||
        perluReviewStatus;
    return {
        provider,
        id_transaksi_provider,
        jenis_transaksi: jenisTransaksi,
        nominal,
        nomor_tujuan: nomorTujuan,
        nama_produk: namaProduk,
        provider_seluler: providerSeluler,
        nama_pemilik: namaPemilik,
        status,
        raw_notification_text: rawText,
        detail_tambahan: detailTambahan,
        perlu_review: perluReview,
    };
}
/**
 * Universal async parsing function with full Fase 2.3.1 features:
 * - Saldo aplikasi separation (both providers)
 * - Non-transaction filter
 * - Dynamic category detection with DB lookup
 * - Alpines structure parsing
 * - Expanded status keywords
 * Returns parsed result plus metadata about filtering
 */
async function parseNotifikasiUniversal(options) {
    const { provider, rawText } = options;
    // 0. Normalisasi whitespace SEBELUM semua ekstraksi (Bug 5 fix)
    // Gunakan versi ternormalisasi untuk SEMUA proses ekstraksi field,
    // tapi raw_notification_text yang disimpan ke DB tetap versi ASLI
    const teksTernormalisasi = (0, universal_1.normalisasiWhitespace)(rawText);
    // 1. Parse struktur Alpines DULU (sebelum pisahkan saldo) agar saldoMatch tidak hilang
    let alpinesStructure = null;
    if (provider === "alpines") {
        alpinesStructure = (0, universal_1.parseStrukturAlpines)(teksTernormalisasi);
    }
    // 2. Pisahkan saldo aplikasi (universal untuk kedua provider)
    const { teksTanpaSaldo, saldoInfo } = (0, universal_1.pisahkanSaldoAplikasi)(teksTernormalisasi);
    // 3. Klasifikasi apakah ini transaksi pelanggan
    const klasifikasi = (0, universal_1.apakahTransaksiPelanggan)(teksTanpaSaldo);
    if (!klasifikasi.valid) {
        return {
            parsed: null,
            filtered: true,
            filterReason: klasifikasi.alasan,
            saldoInfo,
        };
    }
    // 4. Deteksi jenis transaksi universal (dengan sistem kategori dinamis)
    const headerSegment = alpinesStructure?.headerSegment ?? teksTanpaSaldo;
    const { jenis: jenisTransaksiUniversal, perluReview: perluReviewKategori } = await (0, universal_1.tebakJenisTransaksiUniversal)(teksTanpaSaldo, headerSegment);
    // Langkah 1 (revisi): Override untuk Voucher Data Alpines berdasarkan keyword di awal teks asli
    let jenisTransaksi = jenisTransaksiUniversal;
    if (provider === "alpines" && /^\s*Voucher\b/i.test(rawText)) {
        jenisTransaksi = "voucher_data_alpines";
    }
    // 5. Extract nomor tujuan
    const nomorTujuan = (0, extractNomorTujuan_1.extractNomorTujuan)(teksTanpaSaldo, jenisTransaksi);
    // 6. Extract provider seluler (only for pulsa)
    const providerSeluler = jenisTransaksi === "pulsa"
        ? (0, extractProviderSeluler_1.extractProviderSeluler)(teksTanpaSaldo, nomorTujuan)
        : null;
    // 7. Detect e-wallet name for nama_produk
    const ewalletName = detectEwalletName(teksTanpaSaldo);
    // 8. Extract nama produk
    const namaProduk = (0, extractNamaProduk_1.extractNamaProduk)(teksTanpaSaldo, jenisTransaksi, ewalletName);
    const namaPemilik = extractNamaPemilik(teksTanpaSaldo);
    // 9. Status universal (dengan keyword expanded) - need status for nominal extraction
    const detailTambahanTemp = (0, extractDetailTambahan_1.extractDetailTambahan)(teksTanpaSaldo, jenisTransaksi, null);
    const { status, perluReview: perluReviewStatus } = (0, universal_1.extractStatusUniversal)(teksTanpaSaldo, jenisTransaksi, detailTambahanTemp ?? {});
    // 10. Ekstraksi field independen (menggunakan teksTanpaSaldo sebagai basis)
    let nominal = null;
    let nominalDasar = null;
    let sumberDasar = null;
    let adminKonter = 0;
    let tagihanData = null;
    // BUG 3: Special handling for "tagihan" (Bayar Tagihan Telkom/Indihome) via Alpines
    // Call specific parser BEFORE generic Alpines parser
    if (provider === "alpines" && jenisTransaksi === "tagihan") {
        tagihanData = (0, extractNominal_3.tryParseAlpinesTagihanTelkom)(teksTanpaSaldo);
        if (tagihanData) {
            nominalDasar = tagihanData.nominalDasar;
            sumberDasar = tagihanData.sumberDasar;
            // Apply admin konter fee for tagihan (same tier as PLN)
            const adminResult = (0, adminKonter_1.terapkanAdminKonter)(nominalDasar, jenisTransaksi, namaProduk);
            nominal = adminResult.nominalFinal;
            adminKonter = adminResult.adminKonter;
        }
    }
    if (nominalDasar === null) {
        if (provider === "alpines" && alpinesStructure) {
            // Pass pre-parsed structure to avoid re-parsing after saldo removal
            const nominalResult = (0, extractNominal_3.extractNominalForAlpines)(teksTanpaSaldo, alpinesStructure);
            nominalDasar = nominalResult.nominalDasar;
            sumberDasar = nominalResult.sumberDasar;
            // Apply admin konter fee
            const adminResult = (0, adminKonter_1.terapkanAdminKonter)(nominalDasar, jenisTransaksi, namaProduk);
            nominal = adminResult.nominalFinal;
            adminKonter = adminResult.adminKonter;
        }
        else {
            nominalDasar = (0, extractNominal_1.extractNominal)(teksTanpaSaldo, jenisTransaksi);
            // Apply admin konter fee for Digipos too
            const adminResult = (0, adminKonter_1.terapkanAdminKonter)(nominalDasar, jenisTransaksi, namaProduk);
            nominal = adminResult.nominalFinal;
            adminKonter = adminResult.adminKonter;
        }
    }
    // 11. Sanity check — tandai perlu_review jika ada masalah
    const alasanReview = computeAlasanReview({
        jenisTransaksi,
        nominal,
        nomorTujuan,
        status,
    });
    const perluReview = perluReviewKategori || perluReviewStatus || alasanReview !== null;
    // dariSaldoFallback TIDAK lagi memicu perlu_review — ini normal untuk Alpines
    // 12. ID transaksi
    const id_transaksi_provider = computeStableId(provider, teksTanpaSaldo);
    // 13. Detail tambahan lengkap - include Fase 2.7 fields
    const detailTambahan = { ...detailTambahanTemp };
    if (alasanReview && detailTambahan) {
        detailTambahan.alasan_review = alasanReview;
    }
    // Tambahkan saldoInfo ke detail_tambahan untuk audit
    if (saldoInfo && detailTambahan) {
        detailTambahan.saldo_aplikasi_terdeteksi = saldoInfo;
    }
    // Fase 2.7: Add nominal_dasar, sumber_nominal_dasar, admin_konter, saldo_konter
    if (nominalDasar !== null) {
        detailTambahan.nominal_dasar = nominalDasar;
    }
    if (sumberDasar) {
        detailTambahan.sumber_nominal_dasar = sumberDasar;
    }
    // Always include admin_konter (even 0) for audit trail
    detailTambahan.admin_konter = adminKonter;
    // Add tagihan-specific fields if available
    if (tagihanData) {
        detailTambahan.nomor_pelanggan = tagihanData.nomorTujuan;
        detailTambahan.nama_pemilik_tagihan = tagihanData.namaPemilik;
        detailTambahan.periode_tagihan = tagihanData.periodeTagihan;
        detailTambahan.admin_telkom = tagihanData.adminTelkom;
    }
    // Add saldo_konter object for Alpines
    if (provider === "alpines" && alpinesStructure?.saldoMatch) {
        const saldoAwal = (0, extractNominal_2.parseAngkaIndonesia)(alpinesStructure.saldoMatch[1]);
        const potongan = (0, extractNominal_2.parseAngkaIndonesia)(alpinesStructure.saldoMatch[2]);
        const saldoAkhir = (0, extractNominal_2.parseAngkaIndonesia)(alpinesStructure.saldoMatch[3]);
        detailTambahan.saldo_konter = {
            sebelum: saldoAwal,
            terpakai: potongan,
            sesudah: saldoAkhir,
        };
    }
    // 14. Waktu opsional
    (0, extractWaktuOpsional_1.extractWaktuOpsional)(teksTanpaSaldo);
    const parsed = {
        provider,
        id_transaksi_provider,
        jenis_transaksi: jenisTransaksi,
        nominal,
        nomor_tujuan: nomorTujuan,
        nama_produk: namaProduk,
        provider_seluler: providerSeluler,
        nama_pemilik: namaPemilik,
        status,
        raw_notification_text: rawText, // SELALU simpan rawText ASLI UTUH
        detail_tambahan: detailTambahan,
        perlu_review: perluReview,
    };
    return {
        parsed,
        filtered: false,
        saldoInfo,
    };
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function detectEwalletName(text) {
    const lower = text.toLowerCase();
    const known = ["dana", "gopay", "go-pay", "ovo", "shopeepay", "linkaja"];
    for (const name of known) {
        if (lower.includes(name))
            return name;
    }
    return null;
}
function extractNamaPemilik(text) {
    // Pola 1: NAMA:... sampai delimiter /
    const namaMatch = text.match(/NAMA:\s*([^/]+)/i);
    if (namaMatch)
        return namaMatch[1].trim();
    // Pola 2: Segmen kedua di SN/Ref setelah nama e-wallet (format: EWALLET/nama/nomor/nomor/REFF:...)
    const snRefMatch = text.match(/SN\/Ref:\s*(.+?)(?:\.\s*Saldo\s|$)/i);
    if (snRefMatch) {
        const segments = snRefMatch[1].split("/").map((s) => s.trim());
        if (segments.length >= 4) {
            // Segmen ke-2 adalah nama (setelah nama e-wallet di segmen 1)
            const candidate = segments[1];
            // Validasi: tidak terlalu panjang, tidak numerik murni, tidak mengandung "IND" (biasanya operator code)
            if (candidate &&
                candidate.length > 0 &&
                candidate.length < 50 &&
                !/^\d+$/.test(candidate) &&
                !/IND/i.test(candidate)) {
                return candidate;
            }
        }
    }
    return null;
}
function computeAlasanReview(params) {
    const { jenisTransaksi, nominal, nomorTujuan } = params;
    if (jenisTransaksi === "belum_dikenal")
        return "jenis_transaksi tidak dikenali";
    if (nominal === null || nominal <= 0)
        return "nominal tidak ditemukan atau nol";
    // Nomor tujuan HANYA wajib untuk transaksi pulsa (isi ulang pulsa)
    // paket_data, ewallet, voucher, dll tidak selalu punya nomor tujuan
    if (nomorTujuan === null && jenisTransaksi === "pulsa") {
        return "nomor_tujuan tidak ditemukan untuk pulsa";
    }
    if (jenisTransaksi === "pln" && nomorTujuan === null) {
        return "nomor meter/token PLN tidak ditemukan";
    }
    return null;
}
function computeStableId(provider, text) {
    // Gunakan hash sederhana dari teks untuk ID yang stabil
    let hash = 0;
    const str = `${provider}:${text}`;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return `${provider}-${Math.abs(hash).toString(36)}-${Date.now().toString(36)}`;
}
