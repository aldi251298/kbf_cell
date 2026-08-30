// src/lib/parser/whatsappAlpines.ts — FILE BARU, TIDAK ADA IMPORT DARI/KE parser utama

interface HasilParsingTopUp {
  nominalPenambahan: number | null;
  saldoSebelum: number | null;
  saldoSesudah: number | null;
  valid: boolean;
}

function bersihkanAngkaWA(str: string): number {
  return parseInt(str.replace(/\./g, "").replace(/,/g, ""), 10);
}

export function parseTopUpWhatsAppAlpines(rawText: string): HasilParsingTopUp {
  // Pola: "Saldo anda ditambahkan KBF Cell Rp. 1.000.000 (). Saldo 24.427 + 1.000.000 = 1.024.427. Trims..."
  const polaPenambahan = /Rp\.?\s*([\d.,]+)\s*\(/i;
  const polaSaldo = /Saldo\s+([\d.,]+)\s*\+\s*([\d.,]+)\s*=\s*([\d.,]+)/i;

  const matchSaldo = rawText.match(polaSaldo);
  if (!matchSaldo) {
    return { nominalPenambahan: null, saldoSebelum: null, saldoSesudah: null, valid: false };
  }

  const saldoSebelum = bersihkanAngkaWA(matchSaldo[1]);
  const nominalDariSaldo = bersihkanAngkaWA(matchSaldo[2]); // angka penambahan, juga tersedia di sini
  const saldoSesudah = bersihkanAngkaWA(matchSaldo[3]);

  // Prioritaskan angka dari pola "Rp. X (" kalau ada, fallback ke angka dari pola Saldo A + B = C
  const matchRp = rawText.match(polaPenambahan);
  const nominalPenambahan = matchRp ? bersihkanAngkaWA(matchRp[1]) : nominalDariSaldo;

  return {
    nominalPenambahan,
    saldoSebelum,
    saldoSesudah,
    valid: true,
  };
}

export function apakahNotifikasiTopUpAlpines(rawText: string): boolean {
  return /saldo\s+anda\s+ditambahkan/i.test(rawText);
}