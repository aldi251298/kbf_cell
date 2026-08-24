// ---------------------------------------------------------------------------
// Parser Notifikasi Transaksi — Digipos & Alpines
// ---------------------------------------------------------------------------
// Prinsip:
// 1. Coba parser spesifik dulu, berurutan: Digipos-Pulsa, Digipos-PaketData,
//    Digipos-PLN, Alpines-Generic.
// 2. Kalau tidak ada yang cocok, jatuh ke fallback universal — data TETAP
//    tersimpan (tidak pernah ditolak), ditandai perlu_review: true.
// 3. Transaksi "pending" Digipos (sistem sedang sibuk) di-skip total —
//    dilempar sebagai error khusus PENDING_SKIP, ditangkap oleh caller.
// ---------------------------------------------------------------------------

import { parseAngkaIndonesia } from "@/lib/parser/universal";

export interface ParsedNotifikasi {
  provider: string;
  id_transaksi_provider: string;
  jenis_transaksi: string;
  nominal: number;
  nomor_tujuan: string | null;
  nama_produk: string | null;
  sn: string | null;
  status: "sukses" | "gagal" | "pending";
  raw_notification_text: string;
  detail_tambahan: Record<string, unknown> | null;
}

export interface ParseResult {
  parsed: ParsedNotifikasi;
  parserName: string;
}

// ---------------------------------------------------------------------------
// 0. Deteksi transaksi pending (Digipos) — di-skip, tidak diproses
// ---------------------------------------------------------------------------
function isPendingDigipos(text: string): boolean {
  return /sedang dalam peningkatan koneksi|mohon di?\s*coba lagi/i.test(text);
}

// ---------------------------------------------------------------------------
// 1. Digipos — Pulsa
// Pola: "Isi ulang pulsa Rp 20000 untuk no pelanggan 628... [telah] berhasil
//        dengan SN ... dan ID Transaksi ..."
// Catatan: kata "telah" kadang muncul kadang tidak sebelum "berhasil" —
// dibuat opsional. SMS backup (tanpa nominal) TIDAK ditangani parser ini,
// lihat catatan di bagian bawah file.
// ---------------------------------------------------------------------------
function tryParseDigiposPulsa(text: string): ParsedNotifikasi | null {
  const re =
    /Isi ulang pulsa Rp\s*(\d+)\s+untuk no pelanggan\s+(\d+)\s+(?:telah\s+)?berhasil dengan SN\s+(\S+)\s+dan ID Transaksi\s+(\S+)/i;
  const m = text.match(re);
  if (!m) return null;

  const [, nominalStr, nomorTujuan, sn, idTransaksi] = m;

  return {
    provider: "digipos",
    id_transaksi_provider: idTransaksi,
    jenis_transaksi: "pulsa",
    nominal: parseInt(nominalStr, 10),
    nomor_tujuan: nomorTujuan,
    nama_produk: null,
    sn,
    status: "sukses",
    raw_notification_text: text,
    detail_tambahan: null,
  };
}

// ---------------------------------------------------------------------------
// 2. Digipos — Paket Data
// Pola: "Transaksi pengisian paket data {produk} pada {tanggal} senilai
//        Rp{nominal} telah berhasil. MSISDN: {nomor}. ID Transaksi: {id}"
// Catatan: TIDAK ADA spasi setelah "Rp" (beda dari template Pulsa), TIDAK ADA SN.
// ---------------------------------------------------------------------------
function tryParseDigiposPaketData(text: string): ParsedNotifikasi | null {
  const re =
    /Transaksi pengisian paket data\s+(.+?)\s+pada\s+(\d{1,2}\s+\w+\s+\d{4}\s+\d{2}:\d{2}:\d{2})\s+senilai Rp(\d+)\s+telah berhasil\.\s*MSISDN:\s*(\d+)\.\s*ID Transaksi:\s*(\S+)/i;
  const m = text.match(re);
  if (!m) return null;

  const [, namaProduk, tanggalTeks, nominalStr, nomorTujuan, idTransaksi] = m;

  return {
    provider: "digipos",
    id_transaksi_provider: idTransaksi,
    jenis_transaksi: "paket_data",
    nominal: parseInt(nominalStr, 10),
    nomor_tujuan: nomorTujuan,
    nama_produk: namaProduk.trim(),
    sn: null,
    status: "sukses",
    raw_notification_text: text,
    detail_tambahan: { tanggal_teks: tanggalTeks },
  };
}

// ---------------------------------------------------------------------------
// 3. Digipos — PLN
// Pola: "Anda telah melakukan pembayaran PLN senilai {nominal} pada {tanggal}
//        Biaya admin {biaya}. ID Transaksi {id} Saldo LinkAja {saldo}.
//        Token PLN Prabayar Anda {token}. Nometer {meter} atas nama {nama}.
//        {kwh} kWh"
// Catatan: TIDAK ADA kata "berhasil" — status sukses diindikasikan dari
// keberadaan Token. Tidak ada nomor HP (pakai nomor meter, disimpan di
// detail_tambahan, BUKAN nomor_tujuan — PLN tidak punya nomor HP relevan).
// ---------------------------------------------------------------------------
function tryParseDigiposPLN(text: string): ParsedNotifikasi | null {
  const re =
    /Anda telah melakukan pembayaran PLN senilai\s+(\d+)\s+pada\s+([\d-]+\s+[\d:]+)\s+Biaya admin\s+(\d+)\.\s*ID Transaksi\s+(\S+)\s+Saldo LinkAja\s+([\d.,]+)\.\s*Token PLN Prabayar Anda\s+([\d\s]+?)\.\s*Nometer\s+(\d+)\s+atas nama\s+(.+?)\.\s*([\d,]+)\s*kWh/i;
  const m = text.match(re);
  if (!m) return null;

  const [
    ,
    nominalStr,
    tanggalTeks,
    biayaAdmin,
    idTransaksi,
    saldoLinkAja,
    token,
    nomorMeter,
    namaPelanggan,
    kwh,
  ] = m;

  return {
    provider: "digipos",
    id_transaksi_provider: idTransaksi,
    jenis_transaksi: "pln",
    nominal: parseInt(nominalStr, 10),
    nomor_tujuan: null, // PLN sengaja null — bukan nomor HP
    nama_produk: null,
    sn: null,
    status: "sukses",
    raw_notification_text: text,
    detail_tambahan: {
      tanggal_teks: tanggalTeks,
      biaya_admin: parseInt(biayaAdmin, 10),
      saldo_linkaja: saldoLinkAja,
      token_pln: token.trim(),
      nomor_meter: nomorMeter,
      nama_pelanggan: namaPelanggan.trim(),
      kwh,
    },
  };
}

// ---------------------------------------------------------------------------
// 4. Alpines — Generic (e-wallet: DANA/GoPay/OVO/ShopeePay/LinkAja, voucher,
//    paket data, pulsa operator lain, dll)
//
// PENTING: Alpines punya BEBERAPA SUB-FORMAT berbeda yang sudah dikonfirmasi:
// - Tidak selalu diawali kata "Saldo" (voucher kadang langsung nama produk).
// - Field nominal & ID transaksi kadang POSISIONAL (dipisah "/"), kadang
//   pakai LABEL eksplisit (mis. "NOMINAL:200000", "IDT:...").
// Maka parser ini dirancang mencoba SEMUA cara ekstraksi secara berurutan,
// bukan berasumsi satu struktur tetap.
// ---------------------------------------------------------------------------
const KNOWN_EWALLET_NAMES = ["DANA", "GoPay", "OVO", "ShopeePay", "LinkAja"];

function tryParseAlpinesGeneric(text: string): ParsedNotifikasi | null {
  // Anchor wajib: kata "Berhasil"/"GAGAL" DAN "SN/Ref:" — ini satu-satunya
  // pola yang selalu ada di semua varian Alpines, apa pun prefix di depannya.
  const statusMatch = text.match(/\b(Berhasil|GAGAL)\b/i);
  if (!statusMatch) return null;
  if (!/SN\/Ref:/i.test(text)) return null;

  const status: "sukses" | "gagal" =
    statusMatch[1].toLowerCase() === "berhasil" ? "sukses" : "gagal";

  // Deskripsi produk = semua teks dari awal sampai sebelum kata Berhasil/GAGAL
  const descMatch = text.match(/^(.*?)\s*(?:Berhasil|GAGAL)\b/i);
  const description = descMatch ? descMatch[1].trim() : "";

  const knownMatch = KNOWN_EWALLET_NAMES.find((name) =>
    description.toLowerCase().includes(name.toLowerCase()),
  );
  // Kalau bukan e-wallet dikenal, simpan deskripsi apa adanya (dipotong agar
  // tidak kepanjangan) sebagai nama produk — tetap lebih baik daripada kosong.
  const namaProduk =
    (knownMatch ?? description.slice(0, 60)) || "Produk Alpines";

  // Blok SN/Ref utuh
  const snRefMatch = text.match(/SN\/Ref:\s*(.+?)(?:\.\s*Saldo\s|$)/i);
  const snRefBlock = snRefMatch ? snRefMatch[1].trim() : "";

  // --- Ekstraksi NOMINAL, coba berurutan sampai ketemu ---
  let nominal = 0;

  // 1) Format berlabel: "NOMINAL:200000"
  const nominalLabelMatch = text.match(/NOMINAL:\s*([\d.,]+)/i);
  if (nominalLabelMatch) {
    nominal = parseAngkaIndonesia(nominalLabelMatch[1]);
  }

  // 2) Format posisional: segmen 3-6 digit murni di antara "/"
  if (nominal === 0 && snRefBlock.includes("/")) {
    for (const rawSeg of snRefBlock.split("/")) {
      const seg = rawSeg.trim();
      if (/^[\d.,]{3,6}$/.test(seg)) {
        nominal = parseAngkaIndonesia(seg);
        break;
      }
    }
  }

  // 3) Fallback terakhir: dari perhitungan saldo "- X =" — CATATAN: nilai ini
  // bisa termasuk biaya admin (tidak selalu sama persis dengan nominal murni),
  // jadi hanya dipakai kalau dua cara di atas benar-benar tidak ketemu apa pun.
  if (nominal === 0) {
    const saldoCalcMatch = text.match(/-\s*([\d.,]+)\s*=/);
    if (saldoCalcMatch) {
      nominal = parseAngkaIndonesia(saldoCalcMatch[1]);
    }
  }

  // --- Ekstraksi NOMOR TUJUAN ---
  let nomorTujuan: string | null = null;

  // 1) Format posisional: segmen 10-13 digit murni di antara "/"
  if (snRefBlock.includes("/")) {
    for (const rawSeg of snRefBlock.split("/")) {
      const seg = rawSeg.trim();
      if (/^\d{10,13}$/.test(seg)) {
        nomorTujuan = seg;
        break;
      }
    }
  }

  // 2) Fallback: cari pola digit 10-13 karakter di mana saja pada teks,
  // asal bukan bagian dari REFF/IDT (yang jauh lebih panjang)
  if (!nomorTujuan) {
    const reffOrIdt = text.match(/(?:REFF|IDT):(\S+)/i)?.[1] ?? "";
    const withoutReff = reffOrIdt ? text.split(reffOrIdt).join("") : text;
    const nomorMatch = withoutReff.match(/\b(\d{10,13})\b/);
    if (nomorMatch) nomorTujuan = nomorMatch[1];
  }

  // --- Ekstraksi ID TRANSAKSI / REFERENSI ---
  const reffMatch = text.match(/REFF:(\S+)/i);
  const idtMatch = text.match(/IDT:(\S+)/i);
  const idTransaksi =
    reffMatch?.[1] ??
    idtMatch?.[1] ??
    snRefBlock ??
    `ALP-UNKNOWN-${Date.now()}`;

  // --- Ekstraksi SALDO (Saldo A - B = C, ambil semua: sebelum, terpakai, sesudah) ---
  const saldoMatch = text.match(
    /Saldo\s+([\d.,-]+)\s*-\s*([\d.,-]+)\s*=\s*([\d.,-]+)/i,
  );
  const saldoAkhir = saldoMatch ? parseAngkaIndonesia(saldoMatch[3]) : null;
  const saldoKonter = saldoMatch
    ? {
        sebelum: parseAngkaIndonesia(saldoMatch[1]),
        terpakai: parseAngkaIndonesia(saldoMatch[2]),
        sesudah: parseAngkaIndonesia(saldoMatch[3]),
      }
    : null;

  return {
    provider: "alpines",
    id_transaksi_provider: idTransaksi.replace(/\.$/, ""),
    jenis_transaksi: knownMatch ? "ewallet" : "voucher",
    nominal,
    nomor_tujuan: nomorTujuan,
    nama_produk: namaProduk,
    sn: null,
    status,
    raw_notification_text: text,
    detail_tambahan: {
      sn_ref_raw: snRefBlock,
      deskripsi_awal: description,
      saldo_akhir: saldoAkhir,
      saldo_konter: saldoKonter,
    },
  };
}

// ---------------------------------------------------------------------------
// 5. Fallback Universal — dipakai kalau TIDAK ADA parser spesifik yang cocok
// Prinsip mutlak: data TIDAK PERNAH ditolak, minimal tersimpan dengan raw text.
// ---------------------------------------------------------------------------
function fallbackUniversal(text: string): ParsedNotifikasi {
  // Deteksi provider dari isi teks, bukan asumsi default
  let provider = "tidak_diketahui";
  if (/DGPS\S+/i.test(text)) {
    provider = "digipos";
  } else if (/REFF:/i.test(text) || /SN\/Ref:/i.test(text)) {
    provider = "alpines";
  }

  // Status
  let status: "sukses" | "gagal" | "pending" = "pending";
  if (/\btelah berhasil\b|\bberhasil\b/i.test(text)) status = "sukses";
  else if (/\bgagal\b/i.test(text)) status = "gagal";

  // Nominal — coba beberapa pola berurutan, jangan langsung menyerah ke 0
  let nominal = 0;
  const rpMatch = text.match(/Rp\s*([\d.,]+)/i);
  if (rpMatch) {
    nominal = parseAngkaIndonesia(rpMatch[1]);
  } else {
    const senilaiMatch = text.match(/senilai\s+([\d.,]+)/i);
    if (senilaiMatch) {
      nominal = parseAngkaIndonesia(senilaiMatch[1]);
    } else {
      const saldoCalcMatch = text.match(/-\s*([\d.,]+)\s*=/);
      if (saldoCalcMatch) {
        nominal = parseAngkaIndonesia(saldoCalcMatch[1]);
      }
    }
  }

  // ID transaksi / referensi
  const idMatch =
    text.match(/ID Transaksi:?\s*(\S+)/i) || text.match(/REFF:(\S+)/i);
  const idTransaksi = idMatch
    ? idMatch[1].replace(/[.,]$/, "")
    : `UNKNOWN-${Date.now()}`;

  // Nomor tujuan — cari digit 10-13 karakter, TAPI kecualikan yang sama
  // dengan id_transaksi supaya tidak salah ambil ID sebagai nomor HP
  let nomorTujuan: string | null = null;
  const textWithoutId = text.split(idTransaksi).join("");
  const nomorMatch = textWithoutId.match(/\b(\d{10,13})\b/);
  if (nomorMatch) nomorTujuan = nomorMatch[1];

  return {
    provider,
    id_transaksi_provider: idTransaksi,
    jenis_transaksi: "belum_dikenal",
    nominal,
    nomor_tujuan: nomorTujuan,
    nama_produk: null,
    sn: null,
    status,
    raw_notification_text: text,
    detail_tambahan: { perlu_review: true, parsed_by: "fallback_universal" },
  };
}

// ---------------------------------------------------------------------------
// Dispatcher utama — dipanggil dari luar
// ---------------------------------------------------------------------------
export function parseNotifikasi(text: string): ParseResult {
  if (isPendingDigipos(text)) {
    throw new Error("PENDING_SKIP");
  }

  const specificParsers: Array<{
    name: string;
    fn: (t: string) => ParsedNotifikasi | null;
  }> = [
    { name: "digipos_pulsa", fn: tryParseDigiposPulsa },
    { name: "digipos_paket_data", fn: tryParseDigiposPaketData },
    { name: "digipos_pln", fn: tryParseDigiposPLN },
    { name: "alpines_generic", fn: tryParseAlpinesGeneric },
  ];

  for (const parser of specificParsers) {
    const result = parser.fn(text);
    if (result) {
      return { parsed: result, parserName: parser.name };
    }
  }

  // Tidak ada yang cocok — fallback universal, data tetap tersimpan
  return { parsed: fallbackUniversal(text), parserName: "fallback_universal" };
}
