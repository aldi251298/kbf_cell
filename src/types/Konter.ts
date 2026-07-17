export interface Konter {
  id: string;
  nama: string;
  lokasi?: string;
  perangkatId: string; // linked device
}
