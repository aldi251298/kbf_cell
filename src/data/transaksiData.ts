import type { Transaksi, StatusTransaksi } from "@/types";
import { PRODUK_LIST } from "@/constants/produk";
import { KONTER_LIST } from "./konterData";
import { generateSN } from "@/lib/utils";

// Simulated delay to mimic API call
const FAKE_API_DELAY = 400; // ms

// Helper: random item from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper: random number in range
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: random phone number
function generateNomorTujuan(): string {
  const prefixes = [
    "0811",
    "0812",
    "0813",
    "0814",
    "0815",
    "0816",
    "0817",
    "0818",
    "0819",
    "0821",
    "0822",
    "0823",
    "0851",
    "0852",
    "0853",
    "0855",
    "0856",
    "0857",
    "0858",
    "0859",
  ];
  const prefix = randomItem(prefixes);
  const suffix = randomInt(1000000, 9999999).toString();
  return prefix + suffix;
}

// Status distribution: 75% sukses, 15% gagal, 10% pending
function randomStatus(): StatusTransaksi {
  const rand = Math.random();
  if (rand < 0.75) return "sukses";
  if (rand < 0.9) return "gagal";
  return "pending";
}

// Generate a single transaction
function generateSingleTransaksi(date: Date): Transaksi {
  const konter = randomItem(KONTER_LIST);
  const produk = randomItem(PRODUK_LIST);
  const status = randomStatus();

  const waktu = new Date(date);
  // Spread transactions during operating hours (06:00 - 23:00)
  waktu.setHours(randomInt(6, 22), randomInt(0, 59), randomInt(0, 59), 0);

  return {
    id: `TRX-${generateSN().slice(4)}`,
    waktu,
    konterId: konter.id,
    konterNama: konter.nama,
    nomorTujuan: generateNomorTujuan(),
    produk: {
      nama: produk.nama,
      kategori: produk.kategori,
      nominal: produk.nominal,
    },
    nominal:
      status === "sukses"
        ? produk.hargaNormal
        : status === "pending"
          ? produk.hargaNormal
          : Math.floor(produk.hargaNormal * 0.9), // gagal: partial refund
    status,
    sn: generateSN(),
    errorMessage:
      status === "gagal"
        ? randomItem([
            "Network timeout",
            "Provider unavailable",
            "Invalid number",
            "Insufficient balance",
          ])
        : undefined,
  };
}

// Generate transactions for N days (most recent first)
// Realistic distribution: more transactions on weekdays, fewer on weekends
// More transactions during business hours
export async function generateTransaksiData(
  hariKembali: number = 30,
): Promise<Transaksi[]> {
  await new Promise((resolve) => setTimeout(resolve, FAKE_API_DELAY));

  const transactions: Transaksi[] = [];
  const now = new Date();

  for (let i = 0; i < hariKembali; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Weekday vs weekend transaction count
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

    // Base transaction count per day per counter
    let baseCount = isWeekend ? randomInt(15, 35) : randomInt(30, 70);

    // Occasional zero-transaction days (simulating holidays or counter issues)
    if (Math.random() < 0.03) {
      baseCount = 0; // zero transaction day
    }

    // Generate transactions for this day
    for (let j = 0; j < baseCount; j++) {
      transactions.push(generateSingleTransaksi(date));
    }
  }

  // Sort by time descending (most recent first)
  transactions.sort((a, b) => b.waktu.getTime() - a.waktu.getTime());

  return transactions;
}

// Filter transactions by date range, konter, status, and search
export async function filterTransaksiData(
  hariKembali: number = 30,
  filter: {
    startDate?: Date;
    endDate?: Date;
    konterId?: string;
    status?: StatusTransaksi;
    search?: string;
  },
): Promise<Transaksi[]> {
  const allData = await generateTransaksiData(hariKembali);

  return allData.filter((trx) => {
    // Date filter
    if (filter.startDate && trx.waktu < filter.startDate) return false;
    if (filter.endDate && trx.waktu > filter.endDate) return false;

    // Konter filter
    if (filter.konterId && trx.konterId !== filter.konterId) return false;

    // Status filter
    if (filter.status && trx.status !== filter.status) return false;

    // Search filter (nomor tujuan or produk name)
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const nomorMatch = trx.nomorTujuan.includes(filter.search);
      const produkMatch = trx.produk.nama.toLowerCase().includes(searchLower);
      if (!nomorMatch && !produkMatch) return false;
    }

    return true;
  });
}

// Get today's transactions
export async function getTransaksiHariIni(): Promise<Transaksi[]> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const allData = await generateTransaksiData(1); // just today

  return allData.filter((trx) => trx.waktu >= startOfDay);
}
