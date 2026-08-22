/**
 * extractDetailTambahan — extract SN, REFF, ID Transaksi, saldo, alasan review (Bagian 3.8e, 3.7).
 * Updated for Fase 2.3: stores saldo_konter.
 * Updated for Fase 2.3.3: removed kode_transaksi_header and raw_text_history (deduplication removed).
 */

import { parseStrukturAlpines } from "./universal";

export function extractDetailTambahan(
  text: string,
  jenisTransaksi: string,
  alasanReview: string | null,
): Record<string, unknown> | null {
  const detail: Record<string, unknown> = {};

  // SN / SN/Ref — ambil seluruh blok SN/Ref
  const snRefBlockMatch = text.match(/SN\/Ref:\s*(.+?)(?:\.\s*Saldo\s|$)/i);
  if (snRefBlockMatch) {
    detail.sn_ref_raw = snRefBlockMatch[1].trim();
  }

  // SN eksplisit (bisa tanpa colon, cek berbagai pola)
  const snExplicit =
    text.match(/\bSN\b[:\s]*([^\s]+)/i) || text.match(/SN:\s*([^\s]+)/i);
  if (snExplicit) detail.sn = snExplicit[1].trim();

  // REFF
  const reffMatch = text.match(/REFF:\s*(\S+)/i);
  if (reffMatch) detail.reff = reffMatch[1].trim();

  // ID Transaksi / IDT
  const idTransaksiMatch =
    text.match(/ID\s*Transaksi[:\s]*(\S+)/i) || text.match(/IDT:\s*(\S+)/i);
  if (idTransaksiMatch) {
    detail.id_transaksi = idTransaksiMatch[1].trim();
    // Juga simpan sebagai idt untuk kompatibilitas test
    detail.idt = idTransaksiMatch[1].trim();
  }

  // REFF (simpan sebagai id_transaksi jika IDT/ID Transaksi tidak ada)
  const reffMatchDetail = text.match(/REFF:\s*(\S+)/i);
  if (reffMatchDetail && !idTransaksiMatch) {
    detail.id_transaksi = reffMatchDetail[1].trim();
  }

  // Saldo konter (untuk Alpines) - SELALU di detail_tambahan, JANGAN PERNAH ditampilkan sebagai nominal
  const structure = parseStrukturAlpines(text);
  if (structure.saldoMatch) {
    detail.saldo_konter = {
      sebelum: structure.saldoMatch[1],
      terpakai: structure.saldoMatch[2],
      sesudah: structure.saldoMatch[3],
    };
  }

  // Alasan review (jika ada)
  if (alasanReview) {
    detail.alasan_review = alasanReview;
  }

  // PLN-specific fields
  if (jenisTransaksi === "pln") {
    const tokenMatch = text.match(/Token\s+PLN\s+Prabayar\s+Anda\s+([\d\s]+)/i);
    if (tokenMatch) detail.token_pln = tokenMatch[1].trim();

    const meterMatch = text.match(/Nometer\s+(\d+)/i);
    if (meterMatch) detail.nomor_meter = meterMatch[1].trim();

    const namaMatch = text.match(/atas\s+nama\s+(.+?)\./i);
    if (namaMatch) detail.nama_pelanggan = namaMatch[1].trim();

    const kwhMatch = text.match(/([\d,]+)\s*kWh/i);
    if (kwhMatch) detail.kwh = kwhMatch[1].trim();
  }

  return Object.keys(detail).length > 0 ? detail : null;
}
