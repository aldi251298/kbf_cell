"use client";

import { useState, useEffect } from "react";
import { getLaporan, getPerbandinganKonter } from "@/services";
import type { ModeLaporan, LaporanPeriode } from "@/types";
import { formatRupiah, formatAngka, formatAngkaSingkat } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { CardSkeleton, ChartSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Mode options
const MODE_OPTIONS = [
  { value: "harian", label: "Harian", icon: Calendar },
  { value: "bulanan", label: "Bulanan", icon: BarChart2 },
  { value: "tahunan", label: "Tahunan", icon: BarChart3 },
];

// Chart colors matching design system
const CHART_COLORS = ["#c95e3a", "#5a8a5c", "#e09f3a", "#2a8a8a", "#8b5e3c"];

export default function LaporanPage() {
  // Mode state
  const [mode, setMode] = useState<ModeLaporan>("harian");

  // Period state
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState(
    (new Date().getMonth() + 1).toString().padStart(2, "0"),
  );

  // Data state
  const [laporan, setLaporan] = useState<LaporanPeriode | null>(null);
  const [perbandingan, setPerbandingan] = useState<
    Array<{
      konterId: string;
      konterNama: string;
      omzet: number;
      jumlahTransaksi: number;
      persentase: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  // Generate month options
  const monthOptions = [
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  // Fetch data with proper dependencies
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial loading state before fetch is a valid pattern
    setLoading(true);
    const fetchData = async () => {
      try {
        const periode = mode === "harian" ? `${year}-${month}` : year;

        const [laporanData, perbandinganData] = await Promise.all([
          getLaporan(mode, periode),
          getPerbandinganKonter(mode, periode),
        ]);

        if (!cancelled) {
          setLaporan(laporanData);
          setPerbandingan(perbandinganData);
        }
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [mode, year, month]);

  // Generate year options (last 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - i;
    return { value: y.toString(), label: y.toString() };
  });

  // Format period label
  const getPeriodLabel = () => {
    if (mode === "harian") {
      const monthLabel = monthOptions.find((m) => m.value === month)?.label;
      return `${monthLabel} ${year}`;
    }
    return year;
  };

  // Chart data for trend
  const trendChartData =
    laporan?.data.map((item, index) => ({
      name:
        mode === "harian"
          ? item.tanggal
            ? new Date(item.tanggal as Date).getDate().toString()
            : ""
          : mode === "bulanan"
            ? item.bulan
              ? monthOptions.find((m) => m.value === item.bulan?.toString())
                  ?.label || ""
              : ""
            : `Tahun ${String(currentYear - 4 + index)}`,
      omzet: item.omzet,
      transaksi: item.jumlahTransaksi,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary tracking-tight">
          Laporan
        </h1>
        <p className="text-text-secondary mt-1 text-sm">
          Analisis transaksi per periode
        </p>
      </div>

      {/* Mode Tabs & Period Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Mode Tabs */}
            <div className="flex items-center gap-1 rounded-xl bg-surface-secondary p-1 shadow-xs">
              {MODE_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant={mode === option.value ? "default" : "ghost"}
                    size="sm"
                    className={`rounded-lg ${mode === option.value ? "shadow-button-sm" : ""}`}
                    onClick={() => setMode(option.value as ModeLaporan)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {option.label}
                  </Button>
                );
              })}
            </div>

            {/* Period Selectors */}
            <div className="flex flex-wrap items-center gap-3 ml-auto">
              {mode === "harian" && (
                <>
                  <Select
                    options={monthOptions}
                    value={month}
                    onChange={setMonth}
                    className="w-40"
                  />
                  <Select
                    options={yearOptions}
                    value={year}
                    onChange={setYear}
                    className="w-28"
                  />
                </>
              )}
              {(mode === "bulanan" || mode === "tahunan") && (
                <Select
                  options={yearOptions}
                  value={year}
                  onChange={setYear}
                  className="w-28"
                />
              )}

              <Badge variant="outline" size="lg">
                {getPeriodLabel()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : laporan ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Total Omzet */}
          <Card variant="highlight">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Total Omzet</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-accent" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-display font-bold text-text-primary tracking-tight">
                {formatRupiah(laporan.agregat.totalOmzet)}
              </p>
            </CardContent>
          </Card>

          {/* Total Transaksi */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Total Transaksi</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-display font-bold text-text-primary tracking-tight">
                {formatAngka(laporan.agregat.totalTransaksi)}
              </p>
            </CardContent>
          </Card>

          {/* Rata-rata Omzet */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Rata-rata Omzet</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center">
                  <BarChart2 className="h-4 w-4 text-info" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-display font-bold text-text-primary tracking-tight">
                {formatRupiah(laporan.agregat.rataRataOmzet)}
              </p>
            </CardContent>
          </Card>

          {/* Hari Tidak Transaksi */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Hari Tanpa Transaksi</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-error/10 flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-error" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-display font-bold text-text-primary tracking-tight">
                {laporan.agregat.hariTidakTransaksi}
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                dari{" "}
                {laporan.agregat.hariAktif + laporan.agregat.hariTidakTransaksi}{" "}
                hari
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              title="Tidak ada data"
              description="Pilih periode untuk melihat laporan"
            />
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>
                Tren{" "}
                {mode === "harian"
                  ? "Omzet Harian"
                  : mode === "bulanan"
                    ? "Omzet Bulanan"
                    : "Omzet Tahunan"}
              </CardTitle>
              <CardDescription>
                Perkembangan omzet dan jumlah transaksi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trendChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendChartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-subtle)"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="var(--text-tertiary)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="var(--text-tertiary)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        `Rp ${formatAngkaSingkat(value)}`
                      }
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="var(--text-tertiary)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--card-border)",
                        borderRadius: "var(--radius-lg)",
                        boxShadow: "var(--shadow-dropdown-md)",
                      }}
                      labelStyle={{
                        color: "var(--text-primary)",
                        fontWeight: 600,
                      }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="omzet"
                      fill="var(--accent)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="transaksi"
                      fill="var(--info)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="Tidak ada data tren"
                  description="Belum ada data untuk periode yang dipilih"
                />
              )}
            </CardContent>
          </Card>

          {/* Counter Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Perbandingan Konter</CardTitle>
              <CardDescription>Kontribusi omzet per konter</CardDescription>
            </CardHeader>
            <CardContent>
              {perbandingan.length > 0 ? (
                <div className="space-y-4">
                  {perbandingan.map((item, index) => (
                    <div key={item.konterId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                            }}
                          />
                          <span className="text-sm font-medium text-text-primary">
                            {item.konterNama}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-text-primary">
                            {formatRupiah(item.omzet)}
                          </span>
                          <span className="text-xs text-text-tertiary ml-2">
                            ({item.persentase}%)
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-surface-hover overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${item.persentase}%`,
                            backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Tidak ada data perbandingan"
                  description="Belum ada data perbandingan konter"
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
