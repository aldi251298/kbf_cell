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
  ResponsiveContainer,
} from "recharts";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { DistribusiJam } from "@/types/laporanAnalytics";
import { formatAngkaSingkat } from "@/lib/utils";

interface DistribusiJamChartProps {
  data: DistribusiJam[];
  loading?: boolean;
}

export function DistribusiJamChart({
  data,
  loading = false,
}: DistribusiJamChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jam Transaksi Teramai</CardTitle>
          <CardDescription>Distribusi transaksi per jam (0-23)</CardDescription>
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
          <CardTitle>Jam Transaksi Teramai</CardTitle>
          <CardDescription>Distribusi transaksi per jam (0-23)</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Tidak ada data jam"
            description="Belum ada transaksi untuk periode ini"
          />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    jam: item.jam,
    label: `${item.jam.toString().padStart(2, "0")}:00`,
    jumlahTransaksi: item.jumlahTransaksi,
  }));

  const maxValue = Math.max(...chartData.map((d) => d.jumlahTransaksi));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jam Transaksi Teramai</CardTitle>
        <CardDescription>Distribusi transaksi per jam (0-23)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border-subtle))"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              stroke="hsl(var(--text-tertiary))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              interval={2}
            />
            <YAxis
              type="number"
              stroke="hsl(var(--text-tertiary))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatAngkaSingkat(value)}
              domain={[0, maxValue * 1.2 || 10]}
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
              formatter={(value: any) => [value?.toString() ?? "", "Transaksi"]}
              labelFormatter={(label) => label}
            />
            <Bar
              dataKey="jumlahTransaksi"
              name="Transaksi"
              fill="hsl(var(--accent))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
