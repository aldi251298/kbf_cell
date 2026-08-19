import type { Konter } from "@/types";

// KBF Cell counters
export const KONTER_LIST: Konter[] = [
  {
    id: "KONTER-001",
    nama: "KBF Cell Pasar Baru",
    lokasi: "Jakarta Pusat",
    perangkatId: "DEV-001",
  },
  {
    id: "KONTER-002",
    nama: "KBF Cell Jawi Jawi",
    lokasi: "Jawi Jawi",
    perangkatId: "DEV-002",
  },
  {
    id: "KONTER-003",
    nama: "KBF Cell Cupak",
    lokasi: "Cupak",
    perangkatId: "DEV-003",
  },
];

export function getKonterById(id: string): Konter | undefined {
  return KONTER_LIST.find((k) => k.id === id);
}

export function getKonterByPerangkatId(
  perangkatId: string,
): Konter | undefined {
  return KONTER_LIST.find((k) => k.perangkatId === perangkatId);
}
