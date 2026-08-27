"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { TrenHarianData } from "@/types/laporanAnalytics";
import { formatRupiah, formatAngka, formatAngkaSingkat } from "@/lib/utils";

interface TrenHarianChartProps {
  data: TrenHarianData[];
  loading?: boolean;
}

const CHART_COLORS = {
  omzet: "hsl(var(--accent))",
  pendapatanBersih: "hsl(var(--success))",
};

export function TrenHarianChart({
  data,
  loading = false,
}: TrenHarianChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tren Pendapatan</CardTitle>
          <CardDescription>
            Perkembangan omzet dan pendapatan bersih harian
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tren Pendapatan</CardTitle>
          <CardDescription>
            Perkembangan omzet dan pendapatan bersih harian
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Tidak ada data tren"
            description="Belum ada transaksi untuk periode ini"
          />
        </CardContent>
      </Card>
    );
  }

  // Format data for chart - ensure all dates in range are present
  const chartData = data.map((item) => ({
    tanggal: item.tanggal,
    omzet: item.omzet,
    pendapatanBersih: item.pendapatanBersih,
    jumlahTransaksi: item.jumlahTransaksi,
    label: new Date(item.tanggal + "T00:00:00").toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    }),
  }));

  const maxValue = Math.max(
    ...chartData.map((d) => Math.max(d.omzet, d.pendapatanBersih)),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tren Pendapatan</CardTitle>
        <CardDescription>
          Perkembangan omzet dan pendapatan bersih harian
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border-subtle))"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              stroke="hsl(var(--text-tertiary))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={Math.max(1, Math.ceil(chartData.length / 8))}
            />
            <YAxis
              yAxisId="left"
              stroke="hsl(var(--text-tertiary))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `Rp ${formatAngkaSingkat(value)}`}
              domain={[0, maxValue * 1.15]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--card-border))",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-dropdown-md)",
              }}
              labelStyle={{
                color: "hsl(var(--text-primary))",
                fontWeight: 600,
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => {
                if (value === undefined || value === null) return ["", ""];
                if (name === "omzet" || name === "pendapatanBersih") {
                  return [
                    formatRupiah(value),
                    name === "omzet" ? "Omzet" : "Pendapatan Bersih",
                  ];
                }
                return [
                  formatAngka(value),
                  name === "jumlahTransaksi" ? "Transaksi" : name,
                ];
              }}
              labelFormatter={(label) => label}
            />
            <Legend
              wrapperStyle={{ paddingTop: "8px" }}
              formatter={(value) =>
                value === "omzet"
                  ? "Omzet"
                  : value === "pendapatanBersih"
                    ? "Pendapatan Bersih"
                    : value
              }
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="omzet"
              name="Omzet"
              stroke={CHART_COLORS.omzet}
              strokeWidth={2}
              dot={{ r: 4, fill: CHART_COLORS.omzet, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: CHART_COLORS.omzet, strokeWidth: 2 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="pendapatanBersih"
              name="Pendapatan Bersih"
              stroke={CHART_COLORS.pendapatanBersih}
              strokeWidth={2}
              dot={{
                r: 4,
                fill: CHART_COLORS.pendapatanBersih,
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: CHART_COLORS.pendapatanBersih,
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
