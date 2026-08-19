"use client";

import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// DEV-ONLY: Web Simulator Transaksi
// ---------------------------------------------------------------------------
// Route: /dev/simulator
// Halaman ini hanya aktif di environment development (dicek via middleware
// dan juga guard di bawah). Tidak ditautkan dari navigasi utama.
// ---------------------------------------------------------------------------

const TEMPLATES = [
  { value: "digipos-pulsa", label: "Digipos - Isi Ulang Pulsa" },
  { value: "digipos-paketdata", label: "Digipos - Paket Data" },
  { value: "digipos-pln", label: "Digipos - PLN" },
  { value: "alpines-dana", label: "Alpines - Top Up DANA" },
  { value: "alpines-gojek", label: "Alpines - GoPay" },
  { value: "alpines-ovo", label: "Alpines - OVO" },
  { value: "alpines-shopeepay", label: "Alpines - ShopeePay" },
  { value: "alpines-linkaja", label: "Alpines - LinkAja" },
  { value: "alpines-voucher", label: "Alpines - Voucher" },
] as const;

const PRESET_NOMINAL = [5000, 10000, 20000, 25000, 50000, 100000];

// Preset nama produk paket data — termasuk yang punya pola aneh (teks berulang)
const PRESET_PRODUK_PAKET_DATA = [
  "byU Kaget 11GB 28 Hari 28 Hari",
  "Telkomsel OMG 10GB 30 Hari",
  "Flash Ampuh 5GB 7 Hari",
  "XL 10GB 30 Hari",
  "Indosat 15GB 30 Hari",
  "Smartfren 8GB 30 Hari",
  "Tri 12GB 30 Hari",
  "Axis 6GB 7 Hari",
];

// Preset nama pelanggan Indonesia untuk PLN
const PRESET_NAMA_PELANGGAN = [
  "ALAM SUKDIN",
  "BUDI SANTOSO",
  "SITI RAHAYU",
  "AGUS WIJAYA",
  "DEWI LESTARI",
  "RIZAL FIRMANSYAH",
  "NUR HAYATI",
  "HENDRA GUNAWAN",
  "LINA MAHARANI",
  "DEDI KURNIAWAN",
];

// Preset nama e-wallet
const PRESET_EWALLET = [
  "DANA",
  "GoPay",
  "OVO",
  "ShopeePay",
  "LinkAja",
];

const DEVICES = [
  { id: "DEV-001", label: "KBF Cell Pasar Baru (DEV-001)", konterId: "KONTER-001" },
  { id: "DEV-002", label: "KBF Cell Jawi Jawi (DEV-002)", konterId: "KONTER-002" },
  { id: "DEV-003", label: "KBF Cell Cupak (DEV-003)", konterId: "KONTER-003" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function generateSN(): string {
  return Array.from({ length: 20 }, () =>
    Math.floor(Math.random() * 10),
  ).join("");
}

function generateIdTransaksi(provider: string): string {
  const prefix = provider === "digipos" ? "DGPS" : "ALP";
  const ts = Date.now().toString().slice(-10);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${prefix}${ts}${rand}`;
}

function generateNomorHP(): string {
  const prefix = ["62812", "62813", "62821", "62822", "62823", "62852"][
    Math.floor(Math.random() * 6)
  ];
  const body = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 10),
  ).join("");
  return `${prefix}${body}`;
}

function generateNomorMeter(): string {
  // Nomor meter PLN: 11 digit
  return Array.from({ length: 11 }, () =>
    Math.floor(Math.random() * 10),
  ).join("");
}

function generateTokenPLN(): string {
  // Token 4 kelompok 4 digit dipisah spasi
  const group = () =>
    Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join("");
  return `${group()} ${group()} ${group()} ${group()}`;
}

function generateREFF(): string {
  // REFF panjang untuk Alpines (40+ digit)
  return Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 10),
  ).join("");
}

function generateSaldoAcak(): string {
  // Saldo dengan titik sebagai pemisah ribuan (format Indonesia)
  const saldo = Math.floor(Math.random() * 90000) + 1000;
  return saldo.toLocaleString("id-ID");
}

function formatTanggalPaketData(): string {
  // Format: DD Month YYYY HH:mm:ss, nama bulan dalam Bahasa Inggris
  const d = new Date();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const day = d.getDate().toString().padStart(2, "0");
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");
  const secs = d.getSeconds().toString().padStart(2, "0");
  return `${day} ${month} ${year} ${hours}:${mins}:${secs}`;
}

function formatTanggalPLN(): string {
  // Format: DD-MM-YYYY HH:mm:ss (pakai strip)
  const d = new Date();
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");
  const secs = d.getSeconds().toString().padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${mins}:${secs}`;
}

function formatTanggalAlpines(): string {
  // Format: DD/MM HH:mm:ss (tanpa tahun, diawali @)
  const d = new Date();
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");
  const secs = d.getSeconds().toString().padStart(2, "0");
  return `${day}/${month} ${hours}:${mins}:${secs}`;
}

function formatKwh(): string {
  // kWh dengan koma sebagai desimal (format Indonesia)
  const kwh = (Math.random() * 50 + 5).toFixed(1);
  return kwh.replace(".", ",");
}

// ---------------------------------------------------------------------------
// GENERATOR FUNCTIONS — satu per template, sesuai pola spesifik
// ---------------------------------------------------------------------------

/**
 * Template 1: Digipos — Pulsa
 * Pola: "Isi ulang pulsa Rp {nominal} untuk no pelanggan {nomor} berhasil dengan SN {sn} dan ID Transaksi {id}"
 * Ciri: spasi setelah "Rp", kata "berhasil" di tengah, ada SN, tidak ada nama produk
 */
function generateTeksDigiposPulsa(
  nominal: number,
  nomorTujuan: string,
  sn: string,
  idTransaksi: string,
): string {
  return `Isi ulang pulsa Rp ${nominal} untuk no pelanggan ${nomorTujuan} berhasil dengan SN ${sn} dan ID Transaksi ${idTransaksi}`;
}

/**
 * Template 2: Digipos — Paket Data
 * Pola: "Transaksi pengisian paket data {nama_produk} pada {tanggal} senilai Rp{nominal} telah berhasil. MSISDN: {nomor}. ID Transaksi: {id}"
 * Ciri: TIDAK ADA spasi setelah "Rp", "telah berhasil", ada tanggal lengkap, label "MSISDN", tidak ada SN
 */
function generateTeksDigiposPaketData(
  nominal: number,
  nomorTujuan: string,
  namaProduk: string,
  idTransaksi: string,
): string {
  const tanggal = formatTanggalPaketData();
  return `Transaksi pengisian paket data ${namaProduk} pada ${tanggal} senilai Rp${nominal} telah berhasil. MSISDN: ${nomorTujuan}. ID Transaksi: ${idTransaksi}`;
}

/**
 * Template 3: Digipos — PLN
 * Pola: "Anda telah melakukan pembayaran PLN senilai {nominal} pada {tanggal} Biaya admin {biaya}. ID Transaksi {id} Saldo LinkAja {saldo}. Token PLN Prabayar Anda {token}. Nometer {meter} atas nama {nama}. {kwh} kWh"
 * Ciri: tidak ada "berhasil"/"telah berhasil", format tanggal DD-MM-YYYY, token 4x4 digit, kWh pakai koma
 */
function generateTeksDigiposPLN(
  nominal: number,
  nomorMeter: string,
  idTransaksi: string,
): string {
  const tanggal = formatTanggalPLN();
  const biayaAdmin = Math.floor(Math.random() * 3000) + 500;
  const saldo = generateSaldoAcak();
  const token = generateTokenPLN();
  const namaPelanggan =
    PRESET_NAMA_PELANGGAN[Math.floor(Math.random() * PRESET_NAMA_PELANGGAN.length)];
  const kwh = formatKwh();
  return `Anda telah melakukan pembayaran PLN senilai ${nominal} pada ${tanggal} Biaya admin ${biayaAdmin}. ID Transaksi ${idTransaksi} Saldo LinkAja ${saldo}. Token PLN Prabayar Anda ${token}. Nometer ${nomorMeter} atas nama ${namaPelanggan}. ${kwh} kWh`;
}

/**
 * Template 4: Alpines — E-wallet (DANA, GoPay, OVO, ShopeePay, LinkAja)
 * Pola: "Saldo {NAMA_EWALLET}{kode} Berhasil. SN/Ref: {NAMA} TOPUP/{operator}/{nominal}/{nomor}/REFF:{reff}. Saldo {saldo_sebelum} - {nominal_format} = {saldo_sesudah} @{tanggal} {waktu}"
 * Ciri: nama e-wallet nempel ke kode tanpa spasi, "Berhasil" huruf besar, ada "SN/Ref:", nominal di dalam SN/Ref, saldo pakai titik, format DD/MM HH:mm:ss diawali @
 */
function generateTeksAlpinesEwallet(
  ewalletName: string,
  nominal: number,
  nomorTujuan: string,
): string {
  const kodeSingkat = Math.random().toString(36).substring(2, 6).toUpperCase();
  const operator = "MXX INDXXXXXX";
  const saldoSebelum = Math.floor(Math.random() * 500000) + 100000;
  const nominalFormat = nominal.toLocaleString("id-ID");
  const saldoSesudah = saldoSebelum - nominal;
  const tanggal = formatTanggalAlpines();
  const reff = generateREFF();

  return `Saldo ${ewalletName}${kodeSingkat} Berhasil. SN/Ref: ${ewalletName} TOPUP/${operator}/${nominal}/${nomorTujuan}/REFF:${reff}. Saldo ${saldoSebelum.toLocaleString("id-ID")} - ${nominalFormat} = ${saldoSesudah.toLocaleString("id-ID")} @${tanggal}`;
}

/**
 * Template 5: Alpines — Voucher
 * Pola serupa e-wallet tapi dengan nama voucher
 */
function generateTeksAlpinesVoucher(
  nominal: number,
  nomorTujuan: string,
): string {
  const namaVoucher = "VOUCHER GAME";
  const kodeSingkat = Math.random().toString(36).substring(2, 6).toUpperCase();
  const operator = "MXX INDXXXXXX";
  const saldoSebelum = Math.floor(Math.random() * 500000) + 100000;
  const nominalFormat = nominal.toLocaleString("id-ID");
  const saldoSesudah = saldoSebelum - nominal;
  const tanggal = formatTanggalAlpines();
  const reff = generateREFF();

  return `Saldo ${namaVoucher}${kodeSingkat} Berhasil. SN/Ref: ${namaVoucher} TOPUP/${operator}/${nominal}/${nomorTujuan}/REFF:${reff}. Saldo ${saldoSebelum.toLocaleString("id-ID")} - ${nominalFormat} = ${saldoSesudah.toLocaleString("id-ID")} @${tanggal}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ParsedResult {
  provider: string;
  id_transaksi_provider: string;
  jenis_transaksi: string;
  nominal: number;
  nomor_tujuan: string | null;
  nama_produk: string | null;
  sn: string | null;
  status: string;
  raw_notification_text: string;
  detail_tambahan: Record<string, unknown> | null;
}

interface SendResult {
  ok: boolean;
  message: string;
  duplicated?: boolean;
}

interface SessionEntry {
  template: string;
  nominal: number;
  status: string;
  response: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SimulatorPage() {
  // Guard: hanya development
  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Akses Ditolak
          </h1>
          <p className="text-gray-700">
            Halaman simulator hanya tersedia di environment development.
          </p>
        </div>
      </div>
    );
  }

  // Form state
  const [template, setTemplate] = useState<string>("digipos-pulsa");
  const [deviceId, setDeviceId] = useState<string>(DEVICES[0].id);
  const [nominal, setNominal] = useState<number>(20000);
  const [customNominal, setCustomNominal] = useState<string>("");
  const [nomorTujuan, setNomorTujuan] = useState<string>("628519142467");
  const [namaProduk, setNamaProduk] = useState<string>(
    PRESET_PRODUK_PAKET_DATA[0],
  );
  const [sn, setSn] = useState<string>(generateSN());
  const [idTransaksi, setIdTransaksi] = useState<string>(() =>
    generateIdTransaksi("digipos"),
  );
  const [selectedEwallet, setSelectedEwallet] = useState<string>("DANA");

  // Output state
  const [generatedText, setGeneratedText] = useState<string>("");
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);
  const [parserName, setParserName] = useState<string>("");

  // Send state
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [sending, setSending] = useState(false);

  // Session history
  const [history, setHistory] = useState<SessionEntry[]>([]);

  // ---------------------------------------------------------------------------
  // Generate notification text — 4 fungsi terpisah per template
  // ---------------------------------------------------------------------------
  const generateText = useCallback(() => {
    const nom = customNominal ? parseInt(customNominal, 10) : nominal;
    let text = "";

    switch (template) {
      case "digipos-pulsa":
        text = generateTeksDigiposPulsa(nom, nomorTujuan, sn, idTransaksi);
        break;
      case "digipos-paketdata":
        text = generateTeksDigiposPaketData(
          nom,
          nomorTujuan,
          namaProduk,
          idTransaksi,
        );
        break;
      case "digipos-pln":
        text = generateTeksDigiposPLN(nom, nomorTujuan, idTransaksi);
        break;
      case "alpines-dana":
      case "alpines-gojek":
      case "alpines-ovo":
      case "alpines-shopeepay":
      case "alpines-linkaja":
        const ewalletName = selectedEwallet;
        text = generateTeksAlpinesEwallet(ewalletName, nom, nomorTujuan);
        break;
      case "alpines-voucher":
        text = generateTeksAlpinesVoucher(nom, nomorTujuan);
        break;
      default:
        text = "";
    }

    setGeneratedText(text);
    return text;
  }, [
    template,
    nominal,
    customNominal,
    nomorTujuan,
    namaProduk,
    sn,
    idTransaksi,
    selectedEwallet,
  ]);

  // ---------------------------------------------------------------------------
  // Parse preview
  // ---------------------------------------------------------------------------
  const handlePreview = useCallback(() => {
    const text = generateText();
    // Import parser dynamically (client-side)
    import("@/lib/parsers/notifikasiParser").then(({ parseNotifikasi }) => {
      try {
        const result = parseNotifikasi(text);
        setParsedResult(result.parsed as unknown as ParsedResult);
        setParserName(result.parserName);
      } catch (e) {
        // PENDING_SKIP — transaksi pending tidak disimpan
        if (e instanceof Error && e.message === "PENDING_SKIP") {
          setParsedResult(null);
          setParserName("Dilewati (Pending)");
        } else {
          setParsedResult(null);
          setParserName("Tidak cocok");
        }
      }
    });
  }, [generateText]);

  // ---------------------------------------------------------------------------
  // Send to backend via server-side proxy (Fase 2.2: raw text contract)
  // ---------------------------------------------------------------------------
  const handleSend = useCallback(async () => {
    if (!generatedText) {
      setSendResult({ ok: false, message: "Generate teks notifikasi terlebih dahulu." });
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const provider = template.startsWith("digipos") ? "digipos" : "alpines";
      const selectedDevice = DEVICES.find((d) => d.id === deviceId);
      const payload = {
        provider,
        konter_id: selectedDevice?.konterId ?? "KONTER-001",
        raw_notification_text: generatedText,
        waktu_capture: new Date().toISOString(),
      };

      const res = await fetch("/api/simulator/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: SendResult = await res.json();
      setSendResult(data);

      if (data.ok) {
        setHistory((prev) => [
          {
            template,
            nominal: parsedResult?.nominal ?? 0,
            status: data.duplicated ? "DUPLIKAT" : "SUKSES",
            response: data.message,
            timestamp: new Date().toLocaleTimeString("id-ID"),
          },
          ...prev.slice(0, 49),
        ]);
      }
    } catch (err) {
      setSendResult({
        ok: false,
        message: `Error: ${err instanceof Error ? err.message : "Unknown"}`,
      });
    } finally {
      setSending(false);
    }
  }, [generatedText, template, parsedResult]);

  // ---------------------------------------------------------------------------
  // Send duplicate (same raw text → same stable ID → deduped by parser)
  // ---------------------------------------------------------------------------
  const handleSendDuplicate = useCallback(async () => {
    if (!generatedText) {
      setSendResult({ ok: false, message: "Generate teks notifikasi terlebih dahulu." });
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const provider = template.startsWith("digipos") ? "digipos" : "alpines";
      const selectedDevice = DEVICES.find((d) => d.id === deviceId);
      const payload = {
        provider,
        konter_id: selectedDevice?.konterId ?? "KONTER-001",
        raw_notification_text: generatedText,
        waktu_capture: new Date().toISOString(),
      };

      const res = await fetch("/api/simulator/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: SendResult = await res.json();
      setSendResult(data);

      setHistory((prev) => [
        {
          template: `${template} (DUPLIKAT)`,
          nominal: parsedResult?.nominal ?? 0,
          status: data.duplicated ? "DUPLIKAT" : "SUKSES",
          response: data.message,
          timestamp: new Date().toLocaleTimeString("id-ID"),
        },
        ...prev.slice(0, 49),
      ]);
    } catch (err) {
      setSendResult({
        ok: false,
        message: `Error: ${err instanceof Error ? err.message : "Unknown"}`,
      });
    } finally {
      setSending(false);
    }
  }, [generatedText, template, parsedResult]);

  // ---------------------------------------------------------------------------
  // Regenerate IDs when template changes
  // ---------------------------------------------------------------------------
  const handleTemplateChange = (val: string) => {
    setTemplate(val);
    const provider = val.startsWith("digipos") ? "digipos" : "alpines";
    setIdTransaksi(generateIdTransaksi(provider));
    if (val === "digipos-pulsa") setSn(generateSN());
    setParsedResult(null);
    setGeneratedText("");
    setSendResult(null);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Web Simulator Transaksi
          </h1>
          <p className="text-gray-600 mt-1">
            Alat bantu development — generate notifikasi, preview parsing, kirim
            ke backend.
          </p>
          <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
            DEV ONLY
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ========== KIRI: Form ========== */}
          <div className="bg-white shadow rounded-lg p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Form Simulator
            </h2>

            {/* Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Transaksi
              </label>
              <select
                value={template}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {TEMPLATES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Device */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Device / Konter Asal
              </label>
              <select
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {DEVICES.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Nominal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nominal (Rp)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {PRESET_NOMINAL.map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setNominal(n);
                      setCustomNominal("");
                    }}
                    className={`px-3 py-1 text-xs rounded border ${
                      nominal === n && !customNominal
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    {n.toLocaleString("id-ID")}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Atau input manual..."
                value={customNominal}
                onChange={(e) => setCustomNominal(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            {/* Nomor Tujuan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomor Tujuan (HP / Meter)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nomorTujuan}
                  onChange={(e) => setNomorTujuan(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
                <button
                  onClick={() => {
                    if (template === "digipos-pln") {
                      setNomorTujuan(generateNomorMeter());
                    } else {
                      setNomorTujuan(generateNomorHP());
                    }
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-xs rounded border border-gray-300 hover:bg-gray-200"
                >
                  Acak
                </button>
              </div>
            </div>

            {/* Nama Produk (hanya paket data) */}
            {template === "digipos-paketdata" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Produk
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRESET_PRODUK_PAKET_DATA.map((p) => (
                    <button
                      key={p}
                      onClick={() => setNamaProduk(p)}
                      className={`px-3 py-1 text-xs rounded border ${
                        namaProduk === p
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={namaProduk}
                  onChange={(e) => setNamaProduk(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            )}

            {/* E-wallet selection (hanya alpines ewallet) */}
            {(template === "alpines-dana" ||
              template === "alpines-gojek" ||
              template === "alpines-ovo" ||
              template === "alpines-shopeepay" ||
              template === "alpines-linkaja") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama E-Wallet
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_EWALLET.map((ew) => (
                    <button
                      key={ew}
                      onClick={() => setSelectedEwallet(ew)}
                      className={`px-3 py-1 text-xs rounded border ${
                        selectedEwallet === ew
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {ew}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SN (hanya pulsa) */}
            {template === "digipos-pulsa" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SN (Serial Number)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sn}
                    onChange={(e) => setSn(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                    maxLength={20}
                  />
                  <button
                    onClick={() => setSn(generateSN())}
                    className="px-3 py-2 bg-gray-100 text-gray-700 text-xs rounded border border-gray-300 hover:bg-gray-200"
                  >
                    Generate
                  </button>
                </div>
              </div>
            )}

            {/* ID Transaksi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Transaksi / Referensi
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={idTransaksi}
                  onChange={(e) => setIdTransaksi(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                />
                <button
                  onClick={() => {
                    const provider = template.startsWith("digipos")
                      ? "digipos"
                      : "alpines";
                    setIdTransaksi(generateIdTransaksi(provider));
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-xs rounded border border-gray-300 hover:bg-gray-200"
                >
                  Generate
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handlePreview}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
              >
                Generate & Preview
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !parsedResult}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
              >
                {sending ? "Mengirim..." : "Kirim ke Backend"}
              </button>
              <button
                onClick={handleSendDuplicate}
                disabled={sending || !parsedResult}
                className="px-4 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
              >
                Kirim Duplikat
              </button>
            </div>
          </div>

          {/* ========== KANAN: Output ========== */}
          <div className="space-y-6">
            {/* Generated text + parsed result */}
            <div className="bg-white shadow rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Preview Hasil
              </h2>

              {generatedText && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Teks Notifikasi (Generated)
                  </label>
                  <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-800 whitespace-pre-wrap font-mono">
                    {generatedText}
                  </pre>
                </div>
              )}

              {parserName && (
                <div>
                  <span className="text-xs font-medium text-gray-500">
                    Parser:{" "}
                    <span className="text-indigo-600 font-semibold">
                      {parserName}
                    </span>
                  </span>
                </div>
              )}

              {parsedResult && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Hasil Parsing (Terstruktur)
                  </label>
                  <pre className="bg-green-50 border border-green-200 rounded p-3 text-xs text-green-800 whitespace-pre-wrap font-mono">
                    {JSON.stringify(parsedResult, null, 2)}
                  </pre>
                </div>
              )}

              {!generatedText && !parsedResult && (
                <p className="text-sm text-gray-400 italic">
                  Klik "Generate & Preview" untuk melihat hasil.
                </p>
              )}
            </div>

            {/* Backend response */}
            {sendResult && (
              <div
                className={`shadow rounded-lg p-6 ${
                  sendResult.ok ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">
                  Response Backend
                </h2>
                <div
                  className={`text-sm ${
                    sendResult.ok ? "text-green-800" : "text-red-800"
                  }`}
                >
                  <span className="font-semibold">
                    {sendResult.ok ? "✓ Berhasil" : "✗ Gagal"}
                  </span>
                  <p className="mt-1">{sendResult.message}</p>
                  {sendResult.duplicated && (
                    <span className="inline-block mt-2 px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded">
                      Duplikat terdeteksi
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Session history */}
            {history.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">
                  Riwayat Sesi Ini
                </h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs border-b border-gray-100 pb-2"
                    >
                      <div>
                        <span className="font-medium text-gray-700">
                          {entry.template}
                        </span>
                        <span className="text-gray-500 ml-2">
                          Rp{entry.nominal.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            entry.status === "SUKSES"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {entry.status}
                        </span>
                        <span className="text-gray-400">
                          {entry.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}