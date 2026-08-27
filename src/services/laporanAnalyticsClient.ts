/**
 * Client-side service for Laporan Analytics (Fase 2.9)
 * Calls the /api/laporan-analytics endpoint
 */

import type {
  FilterLaporan,
  LaporanAnalyticsData,
} from "@/types/laporanAnalytics";

const API_BASE = "/api/laporan-analytics";

function buildQueryString(filter: FilterLaporan): string {
  const params = new URLSearchParams();
  params.set("periode", filter.periode);
  params.set("konterId", filter.konterId);
  params.set("provider", filter.provider);
  if (filter.tanggalMulai) {
    params.set("tanggalMulai", filter.tanggalMulai.toISOString());
  }
  if (filter.tanggalSelesai) {
    params.set("tanggalSelesai", filter.tanggalSelesai.toISOString());
  }
  return params.toString();
}

/**
 * Fetch all analytics data for the dashboard
 */
export async function getLaporanAnalytics(
  filter: FilterLaporan,
): Promise<LaporanAnalyticsData> {
  const queryString = buildQueryString(filter);
  const res = await fetch(`${API_BASE}?${queryString}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Gagal mengambil data laporan analytics.");
  }
  return res.json();
}

/**
 * Export analytics data to Excel (.xlsx) with professional styling
 */
export async function exportLaporanAnalyticsExcel(
  filter: FilterLaporan,
  data: LaporanAnalyticsData,
): Promise<Blob> {
  // Dynamic import to avoid SSR issues
  const ExcelJS = await import("exceljs");

  // Create workbook
  const workbook = new ExcelJS.Workbook();

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

  const subtitleFont = {
    bold: true,
    size: 11,
    color: { argb: "FF374151" }, // Gray-700
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

  // ============================================================
  // SHEET 1: RINGKASAN EKSEKUTIF
  // ============================================================
  const summarySheet = workbook.addWorksheet("Ringkasan Eksekutif");

  // Title
  const periodeLabels: Record<string, string> = {
    hari_ini: "Hari Ini",
    "7_hari": "7 Hari Terakhir",
    "30_hari": "30 Hari Terakhir",
    bulan_ini: "Bulan Ini",
    custom: "Custom Range",
  };
  const periodeLabel = periodeLabels[filter.periode] ?? filter.periode;

  summarySheet.mergeCells("A1:F1");
  const titleCell = summarySheet.getCell("A1");
  titleCell.value = `Laporan Analytics — ${periodeLabel}`;
  titleCell.font = titleFont;
  titleCell.alignment = { horizontal: "left", vertical: "middle" };
  summarySheet.getRow(1).height = 30;

  // Subtitle - generated date
  summarySheet.mergeCells("A2:F2");
  const subtitleCell = summarySheet.getCell("A2");
  subtitleCell.value = `Dibuat pada: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB`;
  subtitleCell.font = subtitleFont;
  subtitleCell.alignment = { horizontal: "left", vertical: "middle" };
  summarySheet.getRow(2).height = 20;

  // Empty row
  summarySheet.getRow(3).height = 10;

  // Summary headers
  const summaryHeaders = ["Metrik", "Nilai"];
  const summaryHeaderRow = summarySheet.getRow(4);
  summaryHeaders.forEach((header, index) => {
    const cell = summaryHeaderRow.getCell(index + 1);
    cell.value = header;
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.border = thinBorder;
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  summaryHeaderRow.height = 25;

  // Summary data
  const { ringkasan } = data;
  const summaryRows = [
    ["Total Omzet", ringkasan.totalOmzet],
    ["Pendapatan Bersih", ringkasan.totalPendapatanBersih],
    ["Jumlah Transaksi", ringkasan.totalTransaksi],
    ["Rata-rata per Transaksi", ringkasan.rataRataPerTransaksi],
  ];

  summaryRows.forEach((rowData, rowIndex) => {
    const rowNum = rowIndex + 5;
    const row = summarySheet.getRow(rowNum);
    rowData.forEach((cellValue, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      if (colIndex === 1 && typeof cellValue === "number") {
        cell.value = cellValue;
        cell.numFmt = nominalFormat;
      } else {
        cell.value = cellValue;
      }
      cell.font = dataFont;
      cell.border = thinBorder;
      cell.alignment = {
        horizontal: colIndex === 0 ? "left" : "right",
        vertical: "middle",
      };
    });
    // Zebra striping
    if (rowIndex % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = zebraFill;
      });
    }
  });

  // Column widths for summary
  summarySheet.getColumn(1).width = 35;
  summarySheet.getColumn(2).width = 30;

  // ============================================================
  // SHEET 2: BREAKDOWN PER JENIS TRANSAKSI
  // ============================================================
  const breakdownSheet = workbook.addWorksheet("Breakdown Jenis Transaksi");

  // Title
  breakdownSheet.mergeCells("A1:F1");
  const bdTitleCell = breakdownSheet.getCell("A1");
  bdTitleCell.value = `Breakdown per Jenis Transaksi — ${periodeLabel}`;
  bdTitleCell.font = titleFont;
  bdTitleCell.alignment = { horizontal: "left", vertical: "middle" };
  breakdownSheet.getRow(1).height = 30;

  breakdownSheet.getRow(2).height = 10;

  // Breakdown headers
  const bdHeaders = [
    "Kategori",
    "Omzet",
    "Margin (Admin Konter)",
    "Jumlah Transaksi",
    "% Omzet",
  ];
  const bdHeaderRow = breakdownSheet.getRow(3);
  bdHeaders.forEach((header, index) => {
    const cell = bdHeaderRow.getCell(index + 1);
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
  bdHeaderRow.height = 25;

  // Freeze panes
  breakdownSheet.views = [{ state: "frozen", ySplit: 3, activeCell: "A4" }];

  // Auto-filter
  breakdownSheet.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3, column: bdHeaders.length },
  };

  // Breakdown data
  if (data.breakdownJenis && data.breakdownJenis.length > 0) {
    data.breakdownJenis.forEach((item, rowIndex) => {
      const rowNum = rowIndex + 4;
      const row = breakdownSheet.getRow(rowNum);

      const values = [
        item.label,
        item.totalOmzet,
        item.totalAdmin,
        item.jumlahTransaksi,
        item.persentaseOmzet / 100, // as percentage
      ];

      values.forEach((cellValue, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        if (colIndex === 1 || colIndex === 2) {
          // Omzet & Margin - number format
          cell.value = cellValue;
          cell.numFmt = nominalFormat;
        } else if (colIndex === 4) {
          // Percentages
          cell.value = cellValue;
          cell.numFmt = "0.0%";
        } else {
          cell.value = cellValue;
        }
        cell.font = dataFont;
        cell.border = thinBorder;
        cell.alignment = {
          horizontal: colIndex === 0 ? "left" : "right",
          vertical: "middle",
        };
      });

      // Zebra striping
      if (rowIndex % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = zebraFill;
        });
      }
    });

    // Total row
    const totalRowNum = data.breakdownJenis.length + 4;
    const totalRow = breakdownSheet.getRow(totalRowNum);
    breakdownSheet.mergeCells(`A${totalRowNum}:A${totalRowNum}`);

    const totalValues = [
      "TOTAL",
      ringkasan.totalOmzet,
      ringkasan.totalPendapatanBersih,
      ringkasan.totalTransaksi,
      1, // 100%
    ];

    totalValues.forEach((cellValue, colIndex) => {
      const cell = totalRow.getCell(colIndex + 1);
      if (colIndex === 1 || colIndex === 2) {
        cell.value = cellValue;
        cell.numFmt = nominalFormat;
      } else if (colIndex === 4) {
        cell.value = cellValue;
        cell.numFmt = "0%";
      } else {
        cell.value = cellValue;
      }
      cell.font = totalFont;
      cell.border = thickTopBorder;
      cell.alignment = {
        horizontal: colIndex === 0 ? "right" : "right",
        vertical: "middle",
      };
    });
  }

  // Column widths for breakdown
  breakdownSheet.getColumn(1).width = 30;
  breakdownSheet.getColumn(2).width = 20;
  breakdownSheet.getColumn(3).width = 22;
  breakdownSheet.getColumn(4).width = 20;
  breakdownSheet.getColumn(5).width = 15;

  // ============================================================
  // SHEET 3: TREN HARIAN
  // ============================================================
  const trendSheet = workbook.addWorksheet("Tren Harian");

  // Title
  trendSheet.mergeCells("A1:E1");
  const trTitleCell = trendSheet.getCell("A1");
  trTitleCell.value = `Tren Pendapatan — ${periodeLabel}`;
  trTitleCell.font = titleFont;
  trTitleCell.alignment = { horizontal: "left", vertical: "middle" };
  trendSheet.getRow(1).height = 30;

  trendSheet.getRow(2).height = 10;

  // Trend headers
  const trHeaders = [
    "Tanggal",
    "Omzet",
    "Pendapatan Bersih",
    "Jumlah Transaksi",
  ];
  const trHeaderRow = trendSheet.getRow(3);
  trHeaders.forEach((header, index) => {
    const cell = trHeaderRow.getCell(index + 1);
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
  trHeaderRow.height = 25;

  // Freeze panes
  trendSheet.views = [{ state: "frozen", ySplit: 3, activeCell: "A4" }];

  // Auto-filter
  trendSheet.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3, column: trHeaders.length },
  };

  // Trend data
  if (data.trenHarian && data.trenHarian.length > 0) {
    data.trenHarian.forEach((item, rowIndex) => {
      const rowNum = rowIndex + 4;
      const row = trendSheet.getRow(rowNum);

      const values = [
        item.tanggal,
        item.omzet,
        item.pendapatanBersih,
        item.jumlahTransaksi,
      ];

      values.forEach((cellValue, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        if (colIndex === 1 || colIndex === 2) {
          cell.value = cellValue;
          cell.numFmt = nominalFormat;
        } else {
          cell.value = cellValue;
        }
        cell.font = dataFont;
        cell.border = thinBorder;
        cell.alignment = {
          horizontal: colIndex === 0 ? "left" : "right",
          vertical: "middle",
        };
      });

      // Zebra striping
      if (rowIndex % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = zebraFill;
        });
      }
    });
  }

  // Column widths for trend
  trendSheet.getColumn(1).width = 18;
  trendSheet.getColumn(2).width = 20;
  trendSheet.getColumn(3).width = 22;
  trendSheet.getColumn(4).width = 20;

  // ============================================================
  // SHEET 4: PERBANDINGAN KONTER (if available)
  // ============================================================
  if (data.perbandinganKonter && data.perbandinganKonter.length > 0) {
    const konterSheet = workbook.addWorksheet("Perbandingan Konter");

    // Title
    konterSheet.mergeCells("A1:F1");
    const knTitleCell = konterSheet.getCell("A1");
    knTitleCell.value = `Perbandingan Konter — ${periodeLabel}`;
    knTitleCell.font = titleFont;
    knTitleCell.alignment = { horizontal: "left", vertical: "middle" };
    konterSheet.getRow(1).height = 30;

    konterSheet.getRow(2).height = 10;

    // Konter headers
    const knHeaders = [
      "Konter",
      "Omzet",
      "Pendapatan Bersih",
      "Jumlah Transaksi",
      "% Omzet",
    ];
    const knHeaderRow = konterSheet.getRow(3);
    knHeaders.forEach((header, index) => {
      const cell = knHeaderRow.getCell(index + 1);
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
    knHeaderRow.height = 25;

    // Freeze panes
    konterSheet.views = [{ state: "frozen", ySplit: 3, activeCell: "A4" }];

    // Auto-filter
    konterSheet.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: 3, column: knHeaders.length },
    };

    // Konter data
    data.perbandinganKonter.forEach((item, rowIndex) => {
      const rowNum = rowIndex + 4;
      const row = konterSheet.getRow(rowNum);

      const values = [
        item.namaKonter,
        item.totalOmzet,
        item.totalAdmin,
        item.jumlahTransaksi,
        item.persentaseOmzet / 100,
      ];

      values.forEach((cellValue, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        if (colIndex === 1 || colIndex === 2) {
          cell.value = cellValue;
          cell.numFmt = nominalFormat;
        } else if (colIndex === 4) {
          cell.value = cellValue;
          cell.numFmt = "0.0%";
        } else {
          cell.value = cellValue;
        }
        cell.font = dataFont;
        cell.border = thinBorder;
        cell.alignment = {
          horizontal: colIndex === 0 ? "left" : "right",
          vertical: "middle",
        };
      });

      // Zebra striping
      if (rowIndex % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = zebraFill;
        });
      }
    });

    // Column widths for konter
    konterSheet.getColumn(1).width = 25;
    konterSheet.getColumn(2).width = 20;
    konterSheet.getColumn(3).width = 22;
    konterSheet.getColumn(4).width = 20;
    konterSheet.getColumn(5).width = 15;
  }

  // ============================================================
  // SHEET 5: PRODUK TERLARIS
  // ============================================================
  if (data.topProduk && data.topProduk.length > 0) {
    const produkSheet = workbook.addWorksheet("Produk Terlaris");

    // Title
    produkSheet.mergeCells("A1:E1");
    const prTitleCell = produkSheet.getCell("A1");
    prTitleCell.value = `Produk Terlaris — ${periodeLabel}`;
    prTitleCell.font = titleFont;
    prTitleCell.alignment = { horizontal: "left", vertical: "middle" };
    produkSheet.getRow(1).height = 30;

    produkSheet.getRow(2).height = 10;

    // Produk headers
    const prHeaders = ["Rank", "Nama Produk", "Terjual", "Total Omzet"];
    const prHeaderRow = produkSheet.getRow(3);
    prHeaders.forEach((header, index) => {
      const cell = prHeaderRow.getCell(index + 1);
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
    prHeaderRow.height = 25;

    // Freeze panes
    produkSheet.views = [{ state: "frozen", ySplit: 3, activeCell: "A4" }];

    // Auto-filter
    produkSheet.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: 3, column: prHeaders.length },
    };

    // Produk data
    data.topProduk.forEach((item, rowIndex) => {
      const rowNum = rowIndex + 4;
      const row = produkSheet.getRow(rowNum);

      const values = [
        rowIndex + 1,
        item.namaProduk,
        item.jumlahTerjual,
        item.totalOmzet,
      ];

      values.forEach((cellValue, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        if (colIndex === 3) {
          cell.value = cellValue;
          cell.numFmt = nominalFormat;
        } else {
          cell.value = cellValue;
        }
        cell.font = dataFont;
        cell.border = thinBorder;
        cell.alignment = {
          horizontal: colIndex === 1 ? "left" : "right",
          vertical: "middle",
        };
      });

      // Zebra striping
      if (rowIndex % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = zebraFill;
        });
      }
    });

    // Column widths for produk
    produkSheet.getColumn(1).width = 8;
    produkSheet.getColumn(2).width = 40;
    produkSheet.getColumn(3).width = 15;
    produkSheet.getColumn(4).width = 20;
  }

  // ============================================================
  // SHEET 6: DISTRIBUSI JAM
  // ============================================================
  if (data.distribusiJam && data.distribusiJam.length > 0) {
    const jamSheet = workbook.addWorksheet("Distribusi Jam");

    // Title
    jamSheet.mergeCells("A1:C1");
    const jmTitleCell = jamSheet.getCell("A1");
    jmTitleCell.value = `Jam Transaksi Teramai — ${periodeLabel}`;
    jmTitleCell.font = titleFont;
    jmTitleCell.alignment = { horizontal: "left", vertical: "middle" };
    jamSheet.getRow(1).height = 30;

    jamSheet.getRow(2).height = 10;

    // Jam headers
    const jmHeaders = ["Jam", "Jumlah Transaksi"];
    const jmHeaderRow = jamSheet.getRow(3);
    jmHeaders.forEach((header, index) => {
      const cell = jmHeaderRow.getCell(index + 1);
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
    jmHeaderRow.height = 25;

    // Freeze panes
    jamSheet.views = [{ state: "frozen", ySplit: 3, activeCell: "A4" }];

    // Auto-filter
    jamSheet.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: 3, column: jmHeaders.length },
    };

    // Jam data
    data.distribusiJam.forEach((item, rowIndex) => {
      const rowNum = rowIndex + 4;
      const row = jamSheet.getRow(rowNum);

      const values = [
        `${item.jam.toString().padStart(2, "0")}:00`,
        item.jumlahTransaksi,
      ];

      values.forEach((cellValue, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        cell.value = cellValue;
        cell.font = dataFont;
        cell.border = thinBorder;
        cell.alignment = {
          horizontal: colIndex === 0 ? "left" : "right",
          vertical: "middle",
        };
      });

      // Zebra striping
      if (rowIndex % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = zebraFill;
        });
      }
    });

    // Column widths for jam
    jamSheet.getColumn(1).width = 15;
    jamSheet.getColumn(2).width = 20;
  }

  // ============================================================
  // GENERATE BLOB
  // ============================================================
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Generate descriptive filename for Excel export
 */
export function generateLaporanAnalyticsExportFilename(
  filter: FilterLaporan,
): string {
  const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
  return `Laporan-Analytics-${filter.periode}-${dateStr}.xlsx`;
}
