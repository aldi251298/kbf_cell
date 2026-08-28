"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getLaporanAnalytics,
  exportLaporanAnalyticsExcel,
  generateLaporanAnalyticsExportFilename,
} from "@/services";
import type {
  FilterLaporan,
  LaporanAnalyticsData,
} from "@/types/laporanAnalytics";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Loader2 } from "lucide-react";
import { FilterBarLaporan } from "@/components/laporan/FilterBarLaporan";
import { RingkasanCards } from "@/components/laporan/RingkasanCards";
import { TrenHarianChart } from "@/components/laporan/TrenHarianChart";
import { BreakdownJenisChart } from "@/components/laporan/BreakdownJenisChart";
import { BreakdownJenisTable } from "@/components/laporan/BreakdownJenisTable";
import { PerbandinganKonterChart } from "@/components/laporan/PerbandinganKonterChart";
import { TopProdukTable } from "@/components/laporan/TopProdukTable";
import { DistribusiJamChart } from "@/components/laporan/DistribusiJamChart";
import { useUserProfile } from "@/lib/useUserProfile";

const DEFAULT_FILTER: FilterLaporan = {
  periode: "bulan_ini",
  konterId: "semua",
  provider: "semua",
};

export default function LaporanPage() {
  const { profile, loading: profileLoading } = useUserProfile();

  // Initialize filter with user's konter if operator
  const initialFilter: FilterLaporan = {
    ...DEFAULT_FILTER,
    konterId:
      profile?.role === "operator" && profile.konterId
        ? profile.konterId
        : "semua",
  };

  const [filter, setFilter] = useState<FilterLaporan>(initialFilter);
  const [data, setData] = useState<LaporanAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async () => {
    if (profileLoading) return;
    setLoading(true);
    try {
      const result = await getLaporanAnalytics(filter);
      setData(result);
    } catch (error) {
      console.error("Error fetching laporan analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [filter, profileLoading]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (newFilter: FilterLaporan) => {
    setFilter(newFilter);
  };

  const handleExport = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const blob = await exportLaporanAnalyticsExcel(filter, data);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = generateLaporanAnalyticsExportFilename(filter);
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Gagal mengekspor laporan. Silakan coba lagi.");
    } finally {
      setExporting(false);
    }
  };

  const totalOmzet = data?.ringkasan.totalOmzet ?? 0;
  const totalAdmin = data?.ringkasan.totalPendapatanBersih ?? 0;
  const totalTransaksi = data?.ringkasan.totalTransaksi ?? 0;

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary tracking-tight">
              Laporan
            </h1>
            <p className="text-text-secondary mt-1 text-sm">
              Analisis transaksi mendalam dengan grafik & breakdown
            </p>
          </div>
        </div>
        <div className="h-16 bg-white border-b rounded-2xl animate-pulse" />
        <div className="h-24 bg-white rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary tracking-tight">
            Laporan
          </h1>
          <p className="text-text-secondary mt-1 text-sm">
            Analisis transaksi mendalam dengan grafik & breakdown
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExport}
            disabled={exporting || !data}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? "Mengekspor..." : "Ekspor Excel"}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBarLaporan
        filter={filter}
        onChange={handleFilterChange}
        loading={loading}
      />

      {/* Summary Cards */}
      <RingkasanCards
        data={
          data?.ringkasan ?? {
            totalOmzet: 0,
            totalPendapatanBersih: 0,
            totalTransaksi: 0,
            rataRataPerTransaksi: 0,
          }
        }
        loading={loading}
      />

      {/* Charts Section */}
      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Skeleton className="h-80 w-full rounded-2xl" />
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Skeleton className="h-80 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      ) : data ? (
        <>
          {/* Tren Harian Chart */}
          <TrenHarianChart data={data.trenHarian} />

          {/* Breakdown Jenis Transaksi - Chart + Table */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <BreakdownJenisChart data={data.breakdownJenis} />
            <BreakdownJenisTable
              data={data.breakdownJenis}
              totalOmzet={totalOmzet}
              totalAdmin={totalAdmin}
              totalTransaksi={totalTransaksi}
            />
          </div>

          {/* Perbandingan Konter (conditional) - only show for admin when viewing all konters */}
          {profile?.role === "admin" && filter.konterId === "semua" && (
            <PerbandinganKonterChart
              data={data.perbandinganKonter}
              show={true}
            />
          )}

          {/* Top Produk + Distribusi Jam */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <TopProdukTable data={data.topProduk} />
            <DistribusiJamChart data={data.distribusiJam} />
          </div>
        </>
      ) : (
        <Card className="py-12">
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-text-secondary">
                Tidak ada data untuk ditampilkan
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
