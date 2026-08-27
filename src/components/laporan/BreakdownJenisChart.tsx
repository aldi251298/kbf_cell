"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { BreakdownJenisTransaksi } from "@/types/laporanAnalytics";
import { formatRupiah } from "@/lib/utils";

interface BreakdownJenisChartProps {
  data: BreakdownJenisTransaksi[];
  loading?: boolean;
}

const CHART_COLORS = [
  "var(--accent)",
  "var(--success)",
  "var(--warning)",
  "var(--info)",
  "var(--error)",
  "var(--purple)",
  "var(--pink)",
  "var(--teal)",
];

export function BreakdownJenisChart({
  data,
  loading = false,
}: BreakdownJenisChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Breakdown per Jenis Transaksi</CardTitle>
          <CardDescription>
            Kontribusi omzet per kategori produk
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  const filteredData = data.filter((d) => d.totalOmzet > 0);

  if (!filteredData || filteredData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Breakdown per Jenis Transaksi</CardTitle>
          <CardDescription>
            Kontribusi omzet per kategori produk
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Tidak ada data breakdown"
            description="Belum ada transaksi untuk periode ini"
          />
        </CardContent>
      </Card>
    );
  }

  const chartData = filteredData.map((item, index) => ({
    name: item.label,
    value: item.totalOmzet,
    color: CHART_COLORS[index % CHART_COLORS.length],
    jumlahTransaksi: item.jumlahTransaksi,
    totalAdmin: item.totalAdmin,
    persentaseOmzet: item.persentaseOmzet,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Breakdown per Jenis Transaksi</CardTitle>
        <CardDescription>Kontribusi omzet per kategori produk</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(1)}%`
              }
              labelLine={false}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--card-border)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-dropdown-md)",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [
                formatRupiah(value),
                "Omzet",
              ]}
            />
            <Legend
              wrapperStyle={{ paddingTop: "8px" }}
              formatter={(value) => value}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
