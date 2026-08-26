/**
 * Laporan Service Layer
 *
 * Phase 2: implementation now fetches real data from the /api/laporan route
 * (which aggregates from Supabase). Signatures preserved.
 */

import type { ModeLaporan, LaporanPeriode } from "@/types";
import { formatRupiah, formatAngka } from "@/lib/utils";

/**
 * Get period report (daily/monthly/yearly).
 * @param mode - Report mode
 * @param periode - Period identifier (YYYY-MM for harian, YYYY for bulanan/tahunan)
 */
export async function getLaporan(
  mode: ModeLaporan,
  periode: string,
): Promise<LaporanPeriode> {
  const res = await fetch(
    `/api/laporan?mode=${mode}&periode=${encodeURIComponent(periode)}`,
  );
  if (!res.ok) throw new Error("Gagal mengambil laporan.");
  return res.json();
}

/**
 * Get comparison data between counters.
 */
export async function getPerbandinganKonter(
  mode: ModeLaporan,
  periode: string,
): Promise<
  Array<{
    konterId: string;
    konterNama: string;
    omzet: number;
    jumlahTransaksi: number;
    persentase: number;
  }>
> {
  const res = await fetch(
    `/api/laporan?perbandingan=true&mode=${mode}&periode=${encodeURIComponent(periode)}`,
  );
  if (!res.ok) throw new Error("Gagal mengambil perbandingan konter.");
  return res.json();
}

/**
 * Export laporan to Excel (.xlsx) format with professional styling.
 * Reuses ExcelJS styling from transaksiService but adapted for aggregated report data.
 * @param mode - Report mode
 * @param periode - Period identifier
 * @param laporanData - The LaporanPeriode data to export
 */
export async function exportLaporanExcel(
  mode: ModeLaporan,
  periode: string,
  laporanData: LaporanPeriode,
): Promise<Blob> {
  // Dynamic import to avoid SSR issues
  const ExcelJS = await import("exceljs");

  // Create workbook
  const workbook = new ExcelJS.Workbook();

  // ============================================================
  // STYLING DEFINITIONS (consistent with transaksiService)
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
  const modeLabels = {
    harian: "Harian",
    bulanan: "Bulanan",
    tahunan: "Tahunan",
  };
  const periodeLabel =
    mode === "harian"
      ? `Bulan ${periode.split("-")[1]} Tahun ${periode.split("-")[0]}`
      : `Tahun ${periode}`;

  summarySheet.mergeCells("A1:F1");
  const titleCell = summarySheet.getCell("A1");
  titleCell.value = `Laporan ${modeLabels[mode]} — ${periodeLabel}`;
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
  const summaryRows = [
    ["Total Omzet", formatRupiah(laporanData.agregat.totalOmzet)],
    [
      "Total Margin (Keuntungan)",
      formatRupiah(laporanData.agregat.totalMargin),
    ],
    [
      "Margin %",
      laporanData.agregat.totalOmzet > 0
        ? `${((laporanData.agregat.totalMargin / laporanData.agregat.totalOmzet) * 100).toFixed(1)}%`
        : "0%",
    ],
    ["Total Transaksi", formatAngka(laporanData.agregat.totalTransaksi)],
    [
      "Rata-rata Omzet per Periode",
      formatRupiah(laporanData.agregat.rataRataOmzet),
    ],
    [
      "Transaksi Tertinggi",
      formatRupiah(laporanData.agregat.transaksiTertinggi),
    ],
    ["Transaksi Terendah", formatRupiah(laporanData.agregat.transaksiTerendah)],
    ["Hari/Aktif", `${laporanData.agregat.hariAktif} hari`],
    ["Hari Tanpa Transaksi", `${laporanData.agregat.hariTidakTransaksi} hari`],
  ];

  summaryRows.forEach((rowData, rowIndex) => {
    const rowNum = rowIndex + 5;
    const row = summarySheet.getRow(rowNum);
    rowData.forEach((cellValue, colIndex) => {
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
  bdTitleCell.value = `Breakdown per Jenis Transaksi — ${modeLabels[mode]} ${periodeLabel}`;
  bdTitleCell.font = titleFont;
  bdTitleCell.alignment = { horizontal: "left", vertical: "middle" };
  breakdownSheet.getRow(1).height = 30;

  breakdownSheet.getRow(2).height = 10;

  // Breakdown headers
  const bdHeaders = [
    "Kategori",
    "Omzet",
    "Margin",
    "Jumlah Transaksi",
    "% Omzet",
    "% Margin",
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
  if (
    laporanData.breakdownJenisTransaksi &&
    laporanData.breakdownJenisTransaksi.length > 0
  ) {
    laporanData.breakdownJenisTransaksi.forEach((item, rowIndex) => {
      const rowNum = rowIndex + 4;
      const row = breakdownSheet.getRow(rowNum);

      const values = [
        item.label,
        item.omzet,
        item.margin,
        item.jumlahTransaksi,
        item.persentaseOmzet / 100, // as percentage
        item.persentaseMargin / 100,
      ];

      values.forEach((cellValue, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        if (colIndex === 1 || colIndex === 2) {
          // Omzet & Margin - number format
          cell.value = cellValue;
          cell.numFmt = nominalFormat;
        } else if (colIndex === 4 || colIndex === 5) {
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
    const totalRowNum = laporanData.breakdownJenisTransaksi.length + 4;
    const totalRow = breakdownSheet.getRow(totalRowNum);
    breakdownSheet.mergeCells(`A${totalRowNum}:A${totalRowNum}`);

    const totalValues = [
      "TOTAL",
      laporanData.agregat.totalOmzet,
      laporanData.agregat.totalMargin,
      laporanData.agregat.totalTransaksi,
      1, // 100%
      1, // 100%
    ];

    totalValues.forEach((cellValue, colIndex) => {
      const cell = totalRow.getCell(colIndex + 1);
      if (colIndex === 1 || colIndex === 2) {
        cell.value = cellValue;
        cell.numFmt = nominalFormat;
      } else if (colIndex === 4 || colIndex === 5) {
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
  breakdownSheet.getColumn(3).width = 20;
  breakdownSheet.getColumn(4).width = 20;
  breakdownSheet.getColumn(5).width = 15;
  breakdownSheet.getColumn(6).width = 15;

  // ============================================================
  // SHEET 3: DETAIL PER PERIODE (Harian/Bulanan/Tahunan)
  // ============================================================
  const detailSheet = workbook.addWorksheet("Detail Per Periode");

  // Title
  detailSheet.mergeCells("A1:E1");
  const dtTitleCell = detailSheet.getCell("A1");
  dtTitleCell.value = `Detail ${modeLabels[mode]} — ${periodeLabel}`;
  dtTitleCell.font = titleFont;
  dtTitleCell.alignment = { horizontal: "left", vertical: "middle" };
  detailSheet.getRow(1).height = 30;

  detailSheet.getRow(2).height = 10;

  // Detail headers
  const periodLabel =
    mode === "harian" ? "Tanggal" : mode === "bulanan" ? "Bulan" : "Tahun";
  const dtHeaders = [
    periodLabel,
    "Omzet",
    "Margin",
    "Jumlah Transaksi",
    "Rata-rata Omzet",
  ];
  const dtHeaderRow = detailSheet.getRow(3);
  dtHeaders.forEach((header, index) => {
    const cell = dtHeaderRow.getCell(index + 1);
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
  dtHeaderRow.height = 25;

  // Freeze panes
  detailSheet.views = [{ state: "frozen", ySplit: 3, activeCell: "A4" }];

  // Auto-filter
  detailSheet.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3, column: dtHeaders.length },
  };

  // Detail data
  if (laporanData.data && laporanData.data.length > 0) {
    laporanData.data.forEach((item, rowIndex) => {
      const rowNum = rowIndex + 4;
      const row = detailSheet.getRow(rowNum);

      // Calculate margin for this period
      const periodMargin = item.breakdownJenisTransaksi
        ? item.breakdownJenisTransaksi.reduce((s, b) => s + b.margin, 0)
        : 0;

      // Format period label
      let periodStr = "";
      if (mode === "harian" && item.tanggal) {
        periodStr = new Date(item.tanggal).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      } else if (mode === "bulanan" && item.bulan) {
        const monthNames = [
          "Januari",
          "Februari",
          "Maret",
          "April",
          "Mei",
          "Juni",
          "Juli",
          "Agustus",
          "September",
          "Oktober",
          "November",
          "Desember",
        ];
        periodStr = monthNames[item.bulan - 1];
      } else if (mode === "tahunan" && item.tanggal) {
        periodStr = new Date(item.tanggal).getFullYear().toString();
      }

      const values = [
        periodStr,
        item.omzet,
        periodMargin,
        item.jumlahTransaksi,
        item.rataRataNilai,
      ];

      values.forEach((cellValue, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        if (colIndex === 1 || colIndex === 2 || colIndex === 4) {
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

    // Total row
    const totalRowNum = laporanData.data.length + 4;
    const totalRow = detailSheet.getRow(totalRowNum);
    detailSheet.mergeCells(`A${totalRowNum}:A${totalRowNum}`);

    const totalValues = [
      "TOTAL",
      laporanData.agregat.totalOmzet,
      laporanData.agregat.totalMargin,
      laporanData.agregat.totalTransaksi,
      laporanData.agregat.rataRataOmzet,
    ];

    totalValues.forEach((cellValue, colIndex) => {
      const cell = totalRow.getCell(colIndex + 1);
      if (colIndex === 1 || colIndex === 2 || colIndex === 4) {
        cell.value = cellValue;
        cell.numFmt = nominalFormat;
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

  // Column widths for detail
  detailSheet.getColumn(1).width = 20;
  detailSheet.getColumn(2).width = 20;
  detailSheet.getColumn(3).width = 20;
  detailSheet.getColumn(4).width = 20;
  detailSheet.getColumn(5).width = 20;

  // ============================================================
  // SHEET 4: PERBANDINGAN KONTER (if available)
  // ============================================================
  // Note: We don't have perbandingan data here, but we could fetch it
  // For now, we'll skip this sheet since it requires separate API call

  // ============================================================
  // GENERATE BLOB
  // ============================================================
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Generate descriptive filename for laporan export
 */
export function generateLaporanExportFilename(
  mode: ModeLaporan,
  periode: string,
): string {
  const modeLabels = {
    harian: "Harian",
    bulanan: "Bulanan",
    tahunan: "Tahunan",
  };
  const modeLabel = modeLabels[mode];

  let datePart = "";
  if (mode === "harian") {
    // periode is YYYY-MM
    datePart = periode.replace("-", "");
  } else {
    // periode is YYYY
    datePart = periode;
  }

  return `Laporan-${modeLabel}-${datePart}.xlsx`;
}
