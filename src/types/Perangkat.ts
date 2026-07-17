export type StatusOnline = "online" | "offline" | "menyiram"; // menyiram = heartbeat lama tapi belum fully offline

export interface Perangkat {
  id: string;
  nama: string; // label konter (e.g., "Konter A - Jakarta")
  konterId: string;
  status: StatusOnline;
  lastHeartbeat: Date; // waktu heartbeat terakhir
  ip?: string;
  userAgent?: string;
  lokasi?: string;
}

export interface RiwayatStatusPerangkat {
  konterId: string;
  catatan: {
    waktu: Date;
    status: StatusOnline;
    durasiMenit: number; // berapa lama status ini bertahan
  }[];
}
