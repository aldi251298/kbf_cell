import { NextRequest, NextResponse } from "next/server";
import {
  ambilSemuaDataLaporan,
  ambilTransaksiUntukExport,
} from "@/services/laporanAnalyticsService";
import type { FilterLaporan } from "@/types/laporanAnalytics";

/**
 * GET /api/laporan-analytics?periode=hari_ini&konterId=semua&provider=semua
 * GET /api/laporan-analytics?export=true&periode=hari_ini&konterId=semua&provider=semua
 *
 * Returns aggregated analytics data for the Laporan dashboard.
 * Supports CSV export when export=true parameter is provided.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const exportCsv = url.searchParams.get("export") === "true";

  // Parse filter parameters
  const filter: FilterLaporan = {
    periode:
      (url.searchParams.get("periode") as FilterLaporan["periode"]) ??
      "hari_ini",
    konterId: url.searchParams.get("konterId") ?? "semua",
    provider: url.searchParams.get("provider") ?? "semua",
  };

  // Parse custom date range if provided
  const tanggalMulai = url.searchParams.get("tanggalMulai");
  const tanggalSelesai = url.searchParams.get("tanggalSelesai");
  if (tanggalMulai) filter.tanggalMulai = new Date(tanggalMulai);
  if (tanggalSelesai) filter.tanggalSelesai = new Date(tanggalSelesai);

  try {
    if (exportCsv) {
      const rows = await ambilTransaksiUntukExport(filter);

      // Generate CSV
      const header = [
        "Waktu",
        "Konter",
        "Jenis",
        "Produk",
        "Nominal",
        "Admin Konter",
        "Status",
        "Tujuan",
      ];
      const csvRows = rows.map((r) => [
        r.waktu,
        r.konter,
        r.jenis,
        r.produk,
        r.nominal.toString(),
        r.adminKonter.toString(),
        r.status,
        r.tujuan,
      ]);

      const csvContent = [header, ...csvRows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      // Generate filename
      const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const filename = `Laporan-Analytics-${filter.periode}-${dateStr}.csv`;

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv;charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const data = await ambilSemuaDataLaporan(filter);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching laporan analytics:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data laporan analytics" },
      { status: 500 },
    );
  }
}
