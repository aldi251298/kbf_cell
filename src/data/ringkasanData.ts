import type { RingkasanHarian } from "@/types";
import { generateTransaksiData } from "./transaksiData";

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

// Cache for transaction data to avoid regenerating
let transactionCache: { days: number; data: Awaited<ReturnType<typeof generateTransaksiData>> } | null = null;

async function getTransactionData(days: number) {
  if (!transactionCache || transactionCache.days < days) {
    transactionCache = { days, data: await generateTransaksiData(days) };
  }
  return transactionCache.data;
}

export async function getRingkasanHarian(
  tanggal: Date,
): Promise<RingkasanHarian> {
  // Get transactions for the required days
  const now = new Date();
  const daysNeeded = Math.ceil((now.getTime() - tanggal.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const allData = await getTransactionData(Math.max(daysNeeded, 30));
  
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

// Get daily summaries for N days (optimized: single transaction data fetch)
export async function getRingkasanPeriode(
  hariKembali: number = 30,
): Promise<RingkasanHarian[]> {
  // Get all transaction data once
  const allData = await getTransactionData(hariKembali);
  
  const now = new Date();
  const summaries: RingkasanHarian[] = [];

  for (let i = 0; i < hariKembali; i++) {
    const date = addDays(now, -i);
    const dayStart = startOfDay(date);
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
        const konterNama =
          dailyTrx.find((t) => t.konterId === konterId)?.konterNama || "Unknown";
        return { konterId, konterNama, ...data };
      },
    );

    summaries.push({
      tanggal: dayStart,
      totalOmzet,
      totalTransaksi,
      rataRataNilaiTransaksi: Math.round(rataRataNilaiTransaksi),
      transaksiPerStatus,
      kontribusiPerKonter,
    });
  }

  // Sort by date ascending
  summaries.sort((a, b) => a.tanggal.getTime() - b.tanggal.getTime());

  return summaries;
}
