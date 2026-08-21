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

  const res = await fetch(`/api/transaksi?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Gagal mengambil data transaksi.");
  const json = await res.json();
  return json.data as Transaksi[];
}

/**
 * Get today's transactions only (WIB timezone).
 */
export async function getTransaksiHariIniService(): Promise<Transaksi[]> {
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  const now = new Date();
  // now.getTime() returns UTC milliseconds. Add WIB offset (UTC+7) directly.
  // Do NOT use getTimezoneOffset() - it causes double-conversion if server isn't UTC.
  const wibMs = now.getTime() + WIB_OFFSET_MS;
  const wibDate = new Date(wibMs);
  const startOfDayWIB = new Date(
    Date.UTC(
      wibDate.getUTCFullYear(),
      wibDate.getUTCMonth(),
      wibDate.getUTCDate(),
    ),
  );
  const start = new Date(startOfDayWIB.getTime() - WIB_OFFSET_MS);

  const params = new URLSearchParams();
  // Use UTC date components to avoid timezone conversion bug
  const year = start.getUTCFullYear();
  const month = String(start.getUTCMonth() + 1).padStart(2, "0");
  const day = String(start.getUTCDate()).padStart(2, "0");
  params.set("startDate", `${year}-${month}-${day}T00:00:00.000Z`);
  params.set("limit", "1000");

  const res = await fetch(`/api/transaksi?${params.toString()}`, {
    cache: "no-store",
  });
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

  const res = await fetch(`/api/transaksi?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Gagal mengambil data transaksi.");
  return res.json();
}

/**
 * Export transactions to Excel (.xlsx) format with professional styling.
 * Uses ExcelJS for native Excel formatting support.
 */
export async function exportTransaksiExcel(
  filters?: TransaksiFilters,
): Promise<Blob> {
  // Dynamic import to avoid SSR issues
  const ExcelJS = await import("exceljs");

  const params = filtersToParams(filters);
  params.set("limit", "10000");
  // Default sort by waktu ascending (oldest first) for chronological report
  if (!params.has("sortBy")) {
    params.set("sortBy", "waktu");
    params.set("sortOrder", "asc");
  }

  const res = await fetch(`/api/transaksi?${params.toString()}`);
  if (!res.ok) throw new Error("Gagal mengambil data untuk export.");
  const json = await res.json();
  const filteredData: Transaksi[] = json.data;

  // Sort by waktu ascending (chronological) as default
  filteredData.sort(
    (a, b) => new Date(a.waktu).getTime() - new Date(b.waktu).getTime(),
  );

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Riwayat Transaksi");

  // ============================================================
  // STYLING DEFINITIONS
  // ============================================================
  const headerFill = {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FF2563EB" }, // Blue-600 from design system
  };

  const headerFont = {
    bold: true,
    color: { argb: "FFFFFFFF" }, // White
    size: 11,
  };

  const titleFont = {
    bold: true,
    size: 16,
    color: { argb: "FF111827" }, // Gray-900
  };

  const dataFont = {
    size: 11,
  };

  const totalFont = {
    bold: true,
    size: 11,
  };

  const thinBorder = {
    top: { style: "thin" as const, color: { argb: "FFE5E7EB" } },
    left: { style: "thin" as const, color: { argb: "FFE5E7EB" } },
    bottom: { style: "thin" as const, color: { argb: "FFE5E7EB" } },
    right: { style: "thin" as const, color: { argb: "FFE5E7EB" } },
  };

  const thickTopBorder = {
    top: { style: "medium" as const, color: { argb: "FF2563EB" } },
    left: { style: "thin" as const, color: { argb: "FFE5E7EB" } },
    bottom: { style: "thin" as const, color: { argb: "FFE5E7EB" } },
    right: { style: "thin" as const, color: { argb: "FFE5E7EB" } },
  };

  const zebraFill = {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FFF9FAFB" }, // Gray-50
  };

  const nominalFormat = "#,##0";
  const dateFormat = "DD/MM/YYYY HH:mm:ss";

  // ============================================================
  // TITLE ROWS
  // ============================================================
  // Determine konter name for title
  const konterNames = [...new Set(filteredData.map((t) => t.konterNama))];
  const konterTitle =
    konterNames.length === 1 ? konterNames[0] : "Semua Konter";

  // Determine date range for title
  let dateRangeTitle = "";
  if (filteredData.length > 0) {
    const firstDate = new Date(filteredData[0].waktu);
    const lastDate = new Date(filteredData[filteredData.length - 1].waktu);
    const formatDate = (d: Date) =>
      d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    dateRangeTitle = `${formatDate(firstDate)} s/d ${formatDate(lastDate)}`;
  }

  // Row 1: Main title
  worksheet.mergeCells("A1:H1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = `Riwayat Transaksi — ${konterTitle} — ${dateRangeTitle}`;
  titleCell.font = titleFont;
  titleCell.alignment = { horizontal: "left", vertical: "middle" };
  worksheet.getRow(1).height = 30;

  // Row 2: Empty separator
  worksheet.getRow(2).height = 10;

  // ============================================================
  // HEADER ROW (Row 3)
  // ============================================================
  const headers = [
    "Waktu",
    "Konter",
    "Nomor Tujuan",
    "Produk",
    "Kategori",
    "Nominal (Rp)",
    "Status",
    "Serial Number",
  ];

  const headerRow = worksheet.getRow(3);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.border = thinBorder;
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
  });
  headerRow.height = 25;

  // Freeze panes (row 3 = header row)
  worksheet.views = [{ state: "frozen", ySplit: 3, activeCell: "A4" }];

  // Auto-filter on header row
  worksheet.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3, column: headers.length },
  };

  // ============================================================
  // DATA ROWS (starting from row 4)
  // ============================================================
  // Import utilities dynamically to avoid circular dependency
  const { getKategoriLabel, getTampilanTransaksi } =
    await import("@/lib/utils");

  filteredData.forEach((trx, rowIndex) => {
    const rowNum = rowIndex + 4; // Data starts at row 4
    const row = worksheet.getRow(rowNum);

    // Waktu - native Excel date value
    const waktuCell = row.getCell(1);
    waktuCell.value = new Date(trx.waktu);
    waktuCell.numFmt = dateFormat;
    waktuCell.font = dataFont;
    waktuCell.border = thinBorder;
    waktuCell.alignment = { horizontal: "center", vertical: "middle" };

    // Konter
    const konterCell = row.getCell(2);
    konterCell.value = trx.konterNama;
    konterCell.font = dataFont;
    konterCell.border = thinBorder;
    konterCell.alignment = {
      horizontal: "left",
      vertical: "middle",
      wrapText: true,
    };

    // Nomor Tujuan - empty cell for PLN/empty, not "-"
    const nomorCell = row.getCell(3);
    const tampilan = getTampilanTransaksi(
      trx.produk.kategori,
      trx.nomorTujuan,
      trx.produk.nama,
    );
    if (
      tampilan.tampilkanNomorTujuan &&
      trx.nomorTujuan &&
      trx.nomorTujuan !== "-"
    ) {
      nomorCell.value = trx.nomorTujuan;
      nomorCell.alignment = { horizontal: "left", vertical: "middle" };
    } else {
      nomorCell.value = null; // Truly empty cell
    }
    nomorCell.font = dataFont;
    nomorCell.border = thinBorder;

    // Produk
    const produkCell = row.getCell(4);
    produkCell.value = trx.produk.nama;
    produkCell.font = dataFont;
    produkCell.border = thinBorder;
    produkCell.alignment = {
      horizontal: "left",
      vertical: "middle",
      wrapText: true,
    };

    // Kategori - human-readable label
    const kategoriCell = row.getCell(5);
    kategoriCell.value = getKategoriLabel(trx.produk.kategori);
    kategoriCell.font = dataFont;
    kategoriCell.border = thinBorder;
    kategoriCell.alignment = { horizontal: "center", vertical: "middle" };

    // Nominal - number with format
    const nominalCell = row.getCell(6);
    nominalCell.value = trx.nominal;
    nominalCell.numFmt = nominalFormat;
    nominalCell.font = dataFont;
    nominalCell.border = thinBorder;
    nominalCell.alignment = { horizontal: "right", vertical: "middle" };

    // Status
    const statusCell = row.getCell(7);
    statusCell.value = trx.status.charAt(0).toUpperCase() + trx.status.slice(1);
    statusCell.font = dataFont;
    statusCell.border = thinBorder;
    statusCell.alignment = { horizontal: "center", vertical: "middle" };

    // Serial Number - empty if not available
    const snCell = row.getCell(8);
    if (trx.sn && trx.sn !== "-") {
      snCell.value = trx.sn;
    } else {
      snCell.value = null;
    }
    snCell.font = dataFont;
    snCell.border = thinBorder;
    snCell.alignment = { horizontal: "left", vertical: "middle" };

    // Zebra striping
    if (rowIndex % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = zebraFill;
      });
    }
  });

  // ============================================================
  // SUMMARY ROW
  // ============================================================
  const summaryRowNum = filteredData.length + 4;
  const summaryRow = worksheet.getRow(summaryRowNum);

  // Merge first 5 cells for "TOTAL" label
  worksheet.mergeCells(`A${summaryRowNum}:E${summaryRowNum}`);
  const totalLabelCell = summaryRow.getCell(1);
  totalLabelCell.value = "TOTAL";
  totalLabelCell.font = totalFont;
  totalLabelCell.border = thickTopBorder;
  totalLabelCell.alignment = { horizontal: "right", vertical: "middle" };

  // Total nominal
  const totalNominal = filteredData.reduce((sum, trx) => sum + trx.nominal, 0);
  const totalNominalCell = summaryRow.getCell(6);
  totalNominalCell.value = totalNominal;
  totalNominalCell.numFmt = nominalFormat;
  totalNominalCell.font = totalFont;
  totalNominalCell.border = thickTopBorder;
  totalNominalCell.alignment = { horizontal: "right", vertical: "middle" };

  // Total count
  const totalCountCell = summaryRow.getCell(7);
  totalCountCell.value = `${filteredData.length} transaksi`;
  totalCountCell.font = totalFont;
  totalCountCell.border = thickTopBorder;
  totalCountCell.alignment = { horizontal: "center", vertical: "middle" };

  // Empty SN column
  const totalSnCell = summaryRow.getCell(8);
  totalSnCell.border = thickTopBorder;

  // ============================================================
  // COLUMN WIDTHS (auto-fit with reasonable min/max)
  // ============================================================
  const columnWidths = [
    { min: 20, max: 22 }, // Waktu
    { min: 18, max: 30 }, // Konter
    { min: 18, max: 25 }, // Nomor Tujuan
    { min: 25, max: 50 }, // Produk (can be long)
    { min: 16, max: 22 }, // Kategori
    { min: 16, max: 20 }, // Nominal
    { min: 12, max: 14 }, // Status
    { min: 18, max: 30 }, // Serial Number
  ];

  columnWidths.forEach((width, index) => {
    const column = worksheet.getColumn(index + 1);
    // Calculate based on content
    let maxLength = width.min;
    column.eachCell({ includeEmpty: true }, (cell) => {
      if (cell.value) {
        const length = String(cell.value).length;
        if (length > maxLength) maxLength = length;
      }
    });
    column.width = Math.min(Math.max(maxLength + 2, width.min), width.max);
  });

  // ============================================================
  // GENERATE BLOB
  // ============================================================
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Generate descriptive filename for export
 */
export function generateExportFilename(filters?: TransaksiFilters): string {
  const konterNames = filters?.konterId ? [filters.konterId] : ["Semua-Konter"];
  const konterPart =
    konterNames[0] === "Semua-Konter" ? "Semua-Konter" : konterNames[0];

  let datePart = "";
  if (filters?.startDate && filters?.endDate) {
    const formatDate = (d: Date) =>
      d.toISOString().split("T")[0].replace(/-/g, "");
    datePart = `-${formatDate(filters.startDate)}_sd_${formatDate(filters.endDate)}`;
  } else if (filters?.startDate) {
    const formatDate = (d: Date) =>
      d.toISOString().split("T")[0].replace(/-/g, "");
    datePart = `-${formatDate(filters.startDate)}`;
  } else {
    const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
    datePart = `-${today}`;
  }

  return `Riwayat-Transaksi-${konterPart}${datePart}.xlsx`;
}
