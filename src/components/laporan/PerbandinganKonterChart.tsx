"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { PerbandinganKonter } from "@/types/laporanAnalytics";
import { formatRupiah, formatAngka, formatAngkaSingkat } from "@/lib/utils";

interface PerbandinganKonterChartProps {
  data: PerbandinganKonter[];
  loading?: boolean;
  show?: boolean;
}

const CHART_COLORS = ["var(--accent)", "var(--success)", "var(--warning)"];

export function PerbandinganKonterChart({
  data,
  loading = false,
  show = true,
}: PerbandinganKonterChartProps) {
  if (!show) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Perbandingan Konter</CardTitle>
          <CardDescription>Kontribusi omzet per konter</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Perbandingan Konter</CardTitle>
          <CardDescription>Kontribusi omzet per konter</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Tidak ada data perbandingan"
            description="Pilih filter 'Semua Konter' untuk melihat perbandingan"
          />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item, index) => ({
    namaKonter: item.namaKonter,
    totalOmzet: item.totalOmzet,
    totalAdmin: item.totalAdmin,
    jumlahTransaksi: item.jumlahTransaksi,
    persentaseOmzet: item.persentaseOmzet,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const maxValue = Math.max(...chartData.map((d) => d.totalOmzet));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perbandingan Konter</CardTitle>
        <CardDescription>Kontribusi omzet per konter</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-subtle)"
              horizontal={false}
            />
            <XAxis
              type="number"
              stroke="var(--text-tertiary)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `Rp ${formatAngkaSingkat(value)}`}
              domain={[0, maxValue * 1.15]}
            />
            <YAxis
              type="category"
              dataKey="namaKonter"
              stroke="var(--text-tertiary)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={100}
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => {
                if (value === undefined || value === null) return ["", ""];
                if (name === "totalOmzet" || name === "totalAdmin") {
                  return [
                    formatRupiah(value),
                    name === "totalOmzet" ? "Omzet" : "Admin Konter",
                  ];
                }
                return [
                  formatAngka(value),
                  name === "jumlahTransaksi" ? "Transaksi" : name,
                ];
              }}
            />
            <Legend wrapperStyle={{ paddingTop: "8px" }} />
            <Bar
              dataKey="totalOmzet"
              name="Omzet"
              fill="var(--accent)"
              radius={[0, 4, 4, 0]}
            />
            <Bar
              dataKey="totalAdmin"
              name="Admin Konter"
              fill="var(--success)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
