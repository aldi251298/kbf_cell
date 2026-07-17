/**
 * Transaksi Service Layer
 *
 * TODO [BACKEND INTEGRATION]: Replace fake data calls with actual API endpoints:
 * - GET    /api/transaksi       -> fetch transactions
 * - GET    /api/transaksi/:id   -> fetch single transaction
 * - POST   /api/transaksi       -> add new transaction
 * - GET    /api/transaksi/export -> export to Excel/CSV
 *
 * Current implementation uses fake data generator from 'src/data/transaksiData'
 */

import {
  generateTransaksiData,
  filterTransaksiData,
  getTransaksiHariIni,
} from "@/data/transaksiData";
import type { Transaksi, StatusTransaksi, TransaksiDetail, KategoriTransaksi } from "@/types";

// In-memory storage for manually added transactions
const manualTransactions: Transaksi[] = [];

/**
 * Input form data for manual transaction
 */
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

/**
 * Add a new transaction manually
 */
export async function addTransaksiManual(data: TransaksiInputData): Promise<Transaksi> {
  const trx: Transaksi = {
    konterId: data.konterId,
    konterNama: data.konterNama,
    nomorTujuan: data.nomorTujuan,
    produk: data.produk,
    nominal: data.nominal,
    status: data.status,
    sn: `SN-${Date.now().toString(36).toUpperCase()}`,
    detail: data.detail,
    errorMessage: data.errorMessage,
    id: `TRX-MAN-${Date.now()}`,
    waktu: new Date(),
  };
  manualTransactions.unshift(trx);
  return trx;
}

/**
 * Get all transactions including manual ones
 */
async function getAllTransactions(): Promise<Transaksi[]> {
  const generatedData = await generateTransaksiData(30);
  return [...generatedData, ...manualTransactions];
}

/**
 * Get all transactions with optional filters
 * @param hariKembali - Number of days to look back (default: 30)
 * @param filters - Optional filters (date range, konter, status, search)
 * @returns Promise<Transaksi[]>
 */
export async function getTransaksi(
  hariKembali: number = 30,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    konterId?: string;
    status?: StatusTransaksi;
    search?: string;
  },
): Promise<Transaksi[]> {
  if (filters && Object.keys(filters).length > 0) {
    return filterTransaksiData(hariKembali, filters);
  }

  return generateTransaksiData(hariKembali);
}

/**
 * Get today's transactions only
 * @returns Promise<Transaksi[]>
 */
export async function getTransaksiHariIniService(): Promise<Transaksi[]> {
  return getTransaksiHariIni();
}

/**
 * Get paginated transactions (for table with pagination)
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @param filters - Optional filters
 * @returns Promise<{ data: Transaksi[], total: number, page: number, totalPages: number }>
 */
export async function getTransaksiPaginated(
  page: number = 1,
  limit: number = 20,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    konterId?: string;
    status?: StatusTransaksi;
    search?: string;
    sortBy?: "waktu" | "nominal";
    sortOrder?: "asc" | "desc";
  },
): Promise<{
  data: Transaksi[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const allData = await getAllTransactions();
  
  // Apply filters if provided
  let filteredData = allData;
  if (filters) {
    if (filters.startDate) {
      filteredData = filteredData.filter((trx) => trx.waktu >= filters.startDate!);
    }
    if (filters.endDate) {
      filteredData = filteredData.filter((trx) => trx.waktu <= filters.endDate!);
    }
    if (filters.konterId) {
      filteredData = filteredData.filter((trx) => trx.konterId === filters.konterId);
    }
    if (filters.status) {
      filteredData = filteredData.filter((trx) => trx.status === filters.status);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredData = filteredData.filter((trx) =>
        trx.nomorTujuan.includes(filters.search!) ||
        trx.produk.nama.toLowerCase().includes(searchLower) ||
        trx.konterNama.toLowerCase().includes(searchLower)
      );
    }
  }

  // Apply sorting
  if (filters?.sortBy) {
    filteredData.sort((a, b) => {
      const aVal = filters.sortBy === "waktu" ? a.waktu.getTime() : a.nominal;
      const bVal = filters.sortBy === "waktu" ? b.waktu.getTime() : b.nominal;
      return filters.sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
  }

  const total = filteredData.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const data = filteredData.slice(startIndex, endIndex);

  return { data, total, page, totalPages };
}

/**
 * Export transactions to CSV format (client-side)
 * @param filters - Optional filters
 * @returns Promise<string> - CSV content
 */
export async function exportTransaksiCSV(filters?: {
  startDate?: Date;
  endDate?: Date;
  konterId?: string;
  status?: StatusTransaksi;
  search?: string;
}): Promise<string> {
  const data = await getAllTransactions();

  // Apply filters
  let filteredData = data;
  if (filters) {
    if (filters.startDate) {
      filteredData = filteredData.filter((trx) => trx.waktu >= filters.startDate!);
    }
    if (filters.endDate) {
      filteredData = filteredData.filter((trx) => trx.waktu <= filters.endDate!);
    }
    if (filters.konterId) {
      filteredData = filteredData.filter((trx) => trx.konterId === filters.konterId);
    }
    if (filters.status) {
      filteredData = filteredData.filter((trx) => trx.status === filters.status);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredData = filteredData.filter((trx) =>
        trx.nomorTujuan.includes(filters.search!) ||
        trx.produk.nama.toLowerCase().includes(searchLower)
      );
    }
  }

  // Generate CSV content with proper formatting for Excel
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
    // If field contains comma, semicolon, quote, or newline, wrap in quotes
    if (/[;,""\n\r]/.test(str)) {
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
