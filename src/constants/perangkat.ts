export type StatusOnline = "online" | "offline" | "menyiram";

export const STATUS_ONLINE_LABELS: Record<StatusOnline, string> = {
  online: "Online",
  offline: "Offline",
  menyiram: "Terakhir Terlihat",
};

export const STATUS_ONLINE_INDICATOR: Record<
  StatusOnline,
  { color: string; label: string }
> = {
  online: { color: "bg-status-success", label: "Online" },
  offline: { color: "bg-status-offline", label: "Offline" },
  menyiram: { color: "bg-status-warning", label: "Terakhir Terlihat" },
};
