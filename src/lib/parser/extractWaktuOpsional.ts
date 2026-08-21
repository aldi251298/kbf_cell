/**
 * extractWaktuOpsional — optional time extraction from text (Bagian 3.2).
 * Main waktu_transaksi comes from waktu_capture, this is just for reference.
 * Returns null if not found (caller should ignore).
 */

export function extractWaktuOpsional(text: string): string | null {
  // Cari pola tanggal-waktu yang umum di notifikasi
  const patterns = [
    // DD/MM/YYYY HH:mm:ss atau DD/MM HH:mm:ss (Alpines)
    /@(\d{1,2}\/\d{1,2}\s+\d{2}:\d{2}:\d{2})/,
    // DD Month YYYY HH:mm:ss (Digipos Paket Data)
    /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\s+\d{2}:\d{2}:\d{2})/i,
    // DD-MM-YYYY HH:mm:ss (Digipos PLN)
    /(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2})/,
    // DD/MM/YYYY HH:mm:ss
    /(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return null;
}
