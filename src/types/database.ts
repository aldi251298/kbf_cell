/**
 * Database row types for Supabase tables.
 *
 * These mirror the SQL schema in `supabase/schema.sql` and are the raw shape
 * returned by Supabase queries. Mapping functions in `src/lib/mappers.ts`
 * convert these rows into the domain types used by the frontend
 * (see `src/types`), so the UI never touches raw `any` data.
 */

export type StatusTransaksiDb = "sukses" | "gagal" | "pending";
export type KategoriTransaksiDb =
  | "pulsa"
  | "paket_data"
  | "pln"
  | "ewallet_dana"
  | "voucher"
  | "pulsa_op"
  | "p2p"
  | "ewallet"
  | "ppob"
  | "gametopup"
  | "keuangan";

/** Row of the `konter` table. */
export interface KonterRow {
  id: string;
  nama: string;
  lokasi: string | null;
  perangkat_id: string;
  created_at: string;
}

/** Row of the `perangkat` table. */
export interface PerangkatRow {
  id: string;
  nama: string;
  konter_id: string;
  ip: string | null;
  user_agent: string | null;
  lokasi: string | null;
  last_heartbeat: string | null;
  created_at: string;
}

/** Row of the `transaksi` table. */
export interface TransaksiRow {
  id: string;
  waktu: string;
  device_id: string | null;
  konter_id: string | null;
  konter_nama: string;
  provider: "digipos" | "alpines";
  id_transaksi_provider: string;
  sn: string | null;
  jenis_transaksi: string;
  nama_produk: string | null;
  provider_seluler: string | null;
  nama_pemilik: string | null;
  nominal: number | null;
  nomor_tujuan: string | null;
  status: StatusTransaksiDb;
  raw_notification_text: string;
  detail_tambahan: Record<string, unknown> | null;
  perlu_review: boolean;
  created_at: string;
  /** Optional LEFT JOIN result from `konter` table. */
  konter?: { nama: string } | null;
}

/** Row of the `device_heartbeat` table (status change log). */
export interface DeviceHeartbeatRow {
  id: string;
  device_id: string;
  konter_id: string;
  status: "online" | "offline" | "menyiram";
  recorded_at: string;
  duration_minutes: number | null;
}

/** Payload accepted by the ingest endpoint (Fase 2.2 — raw text contract). */
export interface IngestTransaksiPayload {
  provider: "digipos" | "alpines";
  konter_id: string;
  raw_notification_text: string;
  waktu_capture: string;
}

/** Payload accepted by the heartbeat endpoint (from the Android app). */
export interface HeartbeatPayload {
  device_id: string;
  ip?: string;
  user_agent?: string;
}
