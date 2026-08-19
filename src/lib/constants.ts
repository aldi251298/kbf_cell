/**
 * Centralized application constants.
 *
 * These values are referenced across server & client code. Keep them here so
 * there are no "magic numbers" scattered across files (per SRS Bagian 4).
 */

/**
 * Heartbeat thresholds for computing device online/offline status.
 *
 * - ONLINE:  heartbeat within the last `HEARTBEAT_ONLINE_MINUTES` minutes.
 * - MENYIRAM: heartbeat older than online threshold but newer than offline
 *             threshold (a "last seen / stale" state).
 * - OFFLINE:  heartbeat older than the offline threshold.
 *
 * The offline threshold can be overridden via the HEARTBEAT_OFFLINE_MINUTES
 * env var (server-side only); the online threshold is derived as half of it.
 */
export const HEARTBEAT_ONLINE_MINUTES = 2;
export const HEARTBEAT_OFFLINE_MINUTES =
  Number(process.env.HEARTBEAT_OFFLINE_MINUTES) > 0
    ? Number(process.env.HEARTBEAT_OFFLINE_MINUTES)
    : 5;

/**
 * Compute the online status of a device from its last heartbeat time.
 *
 * @param lastHeartbeat - Date of the last received heartbeat.
 * @returns "online" | "menyiram" | "offline"
 */
export function computeDeviceStatus(
  lastHeartbeat: Date | string,
): "online" | "menyiram" | "offline" {
  const last = new Date(lastHeartbeat).getTime();
  const now = Date.now();
  const diffMinutes = (now - last) / 60000;

  if (diffMinutes <= HEARTBEAT_ONLINE_MINUTES) return "online";
  if (diffMinutes <= HEARTBEAT_OFFLINE_MINUTES) return "menyiram";
  return "offline";
}

/** Valid transaction statuses as accepted by the ingest endpoint. */
export const VALID_STATUSES = ["sukses", "gagal", "pending"] as const;

/** Valid providers as accepted by the ingest endpoint. */
export const VALID_PROVIDERS = ["digipos", "alpines"] as const;

/** jenis_transaksi is now free-form string — no enum validation at ingest. */

/** Valid product categories (legacy — kept for backward compat with existing code). */
export const VALID_KATEGORI = [
  "pulsa",
  "data",
  "voucher",
  "p2p",
  "ewallet",
  "ppob",
  "gametopup",
  "keuangan",
] as const;
