import type { RingkasanHarian } from "@/types";
import { generateTransaksiData } from "./transaksiData";

const FAKE_API_DELAY = 300;

// Helper: format date to start of day
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper: add days
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function getRingkasanHarian(
  tanggal: Date,
): Promise<RingkasanHarian> {
  await new Promise((resolve) => setTimeout(resolve, FAKE_API_DELAY));

  // Get transactions for that day
  const allData = await generateTransaksiData(30);
  const dayStart = startOfDay(tanggal);
  const dayEnd = addDays(dayStart, 1);

  const dailyTrx = allData.filter(
    (trx) => trx.waktu >= dayStart && trx.waktu < dayEnd,
  );

  // Calculate aggregates
  const totalOmzet = dailyTrx.reduce((sum, trx) => sum + trx.nominal, 0);
  const totalTransaksi = dailyTrx.length;
  const rataRataNilaiTransaksi =
    totalTransaksi > 0 ? totalOmzet / totalTransaksi : 0;

  // Count by status
  const transaksiPerStatus = {
    sukses: dailyTrx.filter((t) => t.status === "sukses").length,
    gagal: dailyTrx.filter((t) => t.status === "gagal").length,
    pending: dailyTrx.filter((t) => t.status === "pending").length,
  };

  // Contribution per counter
  const konterMap = new Map<
    string,
    { omzet: number; jumlahTransaksi: number }
  >();
  dailyTrx.forEach((trx) => {
    const existing = konterMap.get(trx.konterId) || {
      omzet: 0,
      jumlahTransaksi: 0,
    };
    konterMap.set(trx.konterId, {
      omzet: existing.omzet + trx.nominal,
      jumlahTransaksi: existing.jumlahTransaksi + 1,
    });
  });

  const kontribusiPerKonter = Array.from(konterMap.entries()).map(
    ([konterId, data]) => {
      // Get counter name from ID
      const konterNama =
        dailyTrx.find((t) => t.konterId === konterId)?.konterNama || "Unknown";
      return { konterId, konterNama, ...data };
    },
  );

  return {
    tanggal: dayStart,
    totalOmzet,
    totalTransaksi,
    rataRataNilaiTransaksi: Math.round(rataRataNilaiTransaksi),
    transaksiPerStatus,
    kontribusiPerKonter,
  };
}

// Get daily summaries for N days
export async function getRingkasanPeriode(
  hariKembali: number = 30,
): Promise<RingkasanHarian[]> {
  const now = new Date();
  const summaries: RingkasanHarian[] = [];

  for (let i = 0; i < hariKembali; i++) {
    const date = addDays(now, -i);
    const summary = await getRingkasanHarian(date);
    summaries.push(summary);
  }

  // Sort by date ascending
  summaries.sort((a, b) => a.tanggal.getTime() - b.tanggal.getTime());

  return summaries;
}
