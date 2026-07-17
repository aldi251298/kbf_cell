export type StatusTransaksi = "sukses" | "gagal" | "pending";

export const STATUS_LABELS: Record<StatusTransaksi, string> = {
  sukses: "Sukses",
  gagal: "Gagal",
  pending: "Pending",
};

export const STATUS_COLORS: Record<StatusTransaksi, string> = {
  sukses: "bg-status-success/10 text-status-success",
  gagal: "bg-status-error/10 text-status-error",
  pending: "bg-status-warning/10 text-status-warning",
};

export const STATUS_DESCRIPTIONS: Record<StatusTransaksi, string> = {
  sukses: "Transaksi berhasil diproses",
  gagal: "Transaksi gagal, dana dikembalikan",
  pending: "Transaksi sedang diproses",
};
