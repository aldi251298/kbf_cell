/**
 * extractNomorTujuan � extract nomor_tujuan from notification text (Bagian 3.5).
 * - Pola digit 10�13 karakter diawali 08 atau 62
 * - Untuk PLN: juga terima digit 11�12 polos (nomor meter/token)
 */

export function extractNomorTujuan(
  text: string,
  jenisTransaksi: string,
): string | null {
  // Untuk PLN: cari nomor meter/token (11-12 digit polos, tanpa prefix 08/62)
  if (jenisTransaksi === "pln") {
    // Cari token PLN (20 digit angka murni) terlebih dahulu
    const tokenMatch = text.match(/\b(\d{20})\b/);
    if (tokenMatch) return tokenMatch[1];

    // Cari nomor meter (11-12 digit polos)
    const meterMatch = text.match(/\b(\d{11,12})\b/);
    if (meterMatch) return meterMatch[1];
    return null;
  }

  // Untuk pulsa/paket_data/ewallet: pola 10-13 digit diawali 08 atau 62
  // 1. Cari setelah keyword eksplisit
  const explicitPatterns = [
    /no\s*pelanggan\s+(\d{10,13})/i,
    /no\.\s*(\d{10,13})/i,
    /msisdn:\s*(\d{10,13})/i,
  ];

  for (const re of explicitPatterns) {
    const m = text.match(re);
    if (m) return m[1];
  }

  // 2. Cari pola digit 10-13 di mana saja, kecuali yang bagian dari REFF/IDT
  const reffOrIdt = text.match(/(?:REFF|IDT):(\S+)/i)?.[1] ?? "";
  const withoutReff = reffOrIdt ? text.split(reffOrIdt).join("") : text;
  const genericMatch = withoutReff.match(/\b(\d{10,13})\b/);
  if (genericMatch) return genericMatch[1];

  // 3. Untuk Alpines: cek segmen SN/Ref yang dipisah "/"
  const snRefMatch = text.match(/SN\/Ref:\s*(.+?)(?:\.\s*Saldo\s|$)/i);
  if (snRefMatch) {
    const segments = snRefMatch[1].split("/").map((s) => s.trim());
    for (const seg of segments) {
      if (/^\d{10,13}$/.test(seg) && /^(08|62)/.test(seg)) {
        return seg;
      }
    }
  }

  return null;
}