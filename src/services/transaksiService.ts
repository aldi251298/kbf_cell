/**
 * Transaksi Service Layer
 *
 * Phase 2: implementation now fetches real data from the /api/transaksi route
 * (which reads from Supabase). The function signatures and return shapes are
 * preserved exactly as consumed by the frontend UI components.
 */

import type {
  Transaksi,
  StatusTransaksi,
  TransaksiDetail,
  KategoriTransaksi,
} from "@/types";

/** Input form data for manual transaction. */
export interface TransaksiInputData {
  konterId: string;
  konterNama: string;
  nomorTujuan: string;
  produk: {
    nama: string;
    kategori: KategoriTransaksi;
    nominal: number;
  };
  nominal: number;
  status: StatusTransaksi;
  detail?: TransaksiDetail;
  errorMessage?: string;
}

/** Filters shared across read functions. */
interface TransaksiFilters {
  startDate?: Date;
  endDate?: Date;
  konterId?: string;
  status?: StatusTransaksi;
  search?: string;
}

/** Convert filter object to URL search params. */
function filtersToParams(
  filters:
    (TransaksiFilters & { sortBy?: string; sortOrder?: string }) | undefined,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.startDate)
      params.set("startDate", filters.startDate.toISOString());
    if (filters.endDate) params.set("endDate", filters.endDate.toISOString());
    if (filters.konterId) params.set("konterId", filters.konterId);
    if (filters.status) params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
  }
  return params;
}

/**
 * Add a new transaction manually (from the dashboard "Transaksi Baru" page).
 * Posts to the ingest endpoint using the owner's session via an internal API
 * route that forwards to Supabase with the service role.
 */
export async function addTransaksiManual(
  data: TransaksiInputData,
): Promise<Transaksi> {
  const res = await fetch("/api/transaksi/manual", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Gagal menambahkan transaksi.");
  }
  return res.json();
}

/**
 * Get all transactions with optional filters.
 * @param hariKembali - Number of days to look back (default: 30)
 * @param filters - Optional filters (date range, konter, status, search)
 */
export async function getTransaksi(
  hariKembali: number = 30,
  filters?: TransaksiFilters,
): Promise<Transaksi[]> {
  const params = filtersToParams(filters);
  params.set("limit", "1000");
  // constrain by date range if no explicit startDate
  if (!filters?.startDate) {
    const start = new Date();
    start.setDate(start.getDate() - hariKembali);
    params.set("startDate", start.toISOString());
  }

  const res = await fetch(`/api/transaksi?${params.toString()}`);
  if (!res.ok) throw new Error("Gagal mengambil data transaksi.");
  const json = await res.json();
  return json.data as Transaksi[];
}

/**
 * Get today's transactions only.
 */
export async function getTransaksiHariIniService(): Promise<Transaksi[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const params = new URLSearchParams();
  params.set("startDate", start.toISOString());
  params.set("limit", "1000");

  const res = await fetch(`/api/transaksi?${params.toString()}`);
  if (!res.ok) throw new Error("Gagal mengambil transaksi hari ini.");
  const json = await res.json();
  return json.data as Transaksi[];
}

/**
 * Get paginated transactions (for table with pagination).
 */
export async function getTransaksiPaginated(
  page: number = 1,
  limit: number = 20,
  filters?: TransaksiFilters & {
    sortBy?: "waktu" | "nominal";
    sortOrder?: "asc" | "desc";
  },
): Promise<{
  data: Transaksi[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const params = filtersToParams(filters);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const res = await fetch(`/api/transaksi?${params.toString()}`);
  if (!res.ok) throw new Error("Gagal mengambil data transaksi.");
  return res.json();
}

/**
 * Export transactions to CSV format (client-side from fetched real data).
 * Kept client-side because data volume is small (3 devices) — see SRS Bagian 8.
 */
export async function exportTransaksiCSV(
  filters?: TransaksiFilters,
): Promise<string> {
  const params = filtersToParams(filters);
  params.set("limit", "10000");

  const res = await fetch(`/api/transaksi?${params.toString()}`);
  if (!res.ok) throw new Error("Gagal mengambil data untuk export.");
  const json = await res.json();
  const filteredData: Transaksi[] = json.data;

  const headers = [
    "Waktu",
    "Konter",
    "Nomor Tujuan",
    "Produk",
    "Kategori",
    "Nominal",
    "Status",
    "Serial Number",
  ];

  const escapeCsvField = (field: string | number): string => {
    const str = String(field);
    if (/[;,"\n\r]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const rows = filteredData.map((trx) => [
    trx.waktu.toLocaleString("id-ID"),
    trx.konterNama,
    trx.nomorTujuan || "-",
    trx.produk.nama,
    trx.produk.kategori,
    trx.nominal,
    trx.status,
    trx.sn || "-",
  ]);

  const csvContent = [
    headers.join(";"),
    ...rows.map((row) => row.map(escapeCsvField).join(";")),
  ].join("\n");

  return csvContent;
}
