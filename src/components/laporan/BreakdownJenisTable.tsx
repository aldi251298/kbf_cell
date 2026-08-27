"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { BreakdownJenisTransaksi } from "@/types/laporanAnalytics";
import { formatRupiah, formatAngka } from "@/lib/utils";
import { IkonJenisTransaksi } from "@/components/ui/IkonJenisTransaksi";

interface BreakdownJenisTableProps {
  data: BreakdownJenisTransaksi[];
  loading?: boolean;
  totalOmzet?: number;
  totalAdmin?: number;
  totalTransaksi?: number;
}

export function BreakdownJenisTable({
  data,
  loading = false,
  totalOmzet = 0,
  totalAdmin = 0,
  totalTransaksi = 0,
}: BreakdownJenisTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detail Breakdown per Jenis Transaksi</CardTitle>
          <CardDescription>
            Omzet, margin, dan jumlah transaksi per kategori
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredData = data.filter((d) => d.totalOmzet > 0);

  if (!filteredData || filteredData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detail Breakdown per Jenis Transaksi</CardTitle>
          <CardDescription>
            Omzet, margin, dan jumlah transaksi per kategori
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detail Breakdown per Jenis Transaksi</CardTitle>
        <CardDescription>
          Omzet, margin, dan jumlah transaksi per kategori
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-text-secondary">
                  Kategori
                </th>
                <th className="text-right py-2 px-3 font-medium text-text-secondary">
                  Omzet
                </th>
                <th className="text-right py-2 px-3 font-medium text-text-secondary">
                  Admin Konter
                </th>
                <th className="text-right py-2 px-3 font-medium text-text-secondary">
                  Transaksi
                </th>
                <th className="text-right py-2 px-3 font-medium text-text-secondary">
                  % Omzet
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr
                  key={item.jenis}
                  className="border-b border-border/50 hover:bg-surface-hover/50"
                >
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <IkonJenisTransaksi jenis={item.jenis} size={24} />
                      <span className="font-medium text-text-primary">
                        {item.label}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-text-primary">
                    {formatRupiah(item.totalOmzet)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-success">
                    {formatRupiah(item.totalAdmin)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-text-primary">
                    {formatAngka(item.jumlahTransaksi)}
                  </td>
                  <td className="py-2 px-3 text-right text-text-secondary">
                    {item.persentaseOmzet}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border font-semibold">
                <td className="py-2 px-3 text-text-primary">TOTAL</td>
                <td className="py-2 px-3 text-right font-mono text-text-primary">
                  {formatRupiah(totalOmzet)}
                </td>
                <td className="py-2 px-3 text-right font-mono text-success">
                  {formatRupiah(totalAdmin)}
                </td>
                <td className="py-2 px-3 text-right font-mono text-text-primary">
                  {formatAngka(totalTransaksi)}
                </td>
                <td className="py-2 px-3 text-right text-text-secondary">
                  100%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
