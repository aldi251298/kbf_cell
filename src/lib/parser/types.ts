/**
 * Types for the centralized parser module (Fase 2.2).
 */

export interface ParsedTransaksi {
  provider: string;
  id_transaksi_provider: string;
  jenis_transaksi: string;
  nominal: number | null;
  nomor_tujuan: string | null;
  nama_produk: string | null;
  provider_seluler: string | null;
  nama_pemilik: string | null;
  status: "sukses" | "gagal" | "pending";
  raw_notification_text: string;
  detail_tambahan: Record<string, unknown> | null;
  perlu_review: boolean;
}

export interface ParseOptions {
  /** If true, throw on pending Digipos instead of returning status=pending */
  strictPending?: boolean;
}