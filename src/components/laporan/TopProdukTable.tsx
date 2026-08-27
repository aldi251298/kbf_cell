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
import type { TopProduk } from "@/types/laporanAnalytics";
import { formatRupiah, formatAngka } from "@/lib/utils";
import { LogoBrand } from "@/components/ui/LogoBrand";
import { Trophy } from "lucide-react";

interface TopProdukTableProps {
  data: TopProduk[];
  loading?: boolean;
}

export function TopProdukTable({ data, loading = false }: TopProdukTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Produk Terlaris</CardTitle>
          <CardDescription>
            Ranking produk berdasarkan jumlah terjual
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

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Produk Terlaris</CardTitle>
          <CardDescription>
            Ranking produk berdasarkan jumlah terjual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={
              <Trophy
                className="h-10 w-10 text-text-tertiary"
                strokeWidth={1.5}
              />
            }
            title="Tidak ada data produk"
            description="Belum ada transaksi untuk periode ini"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produk Terlaris</CardTitle>
        <CardDescription>
          Ranking produk berdasarkan jumlah terjual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-text-secondary w-8">
                  #
                </th>
                <th className="text-left py-2 px-3 font-medium text-text-secondary">
                  Nama Produk
                </th>
                <th className="text-right py-2 px-3 font-medium text-text-secondary">
                  Terjual
                </th>
                <th className="text-right py-2 px-3 font-medium text-text-secondary">
                  Total Omzet
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr
                  key={item.namaProduk}
                  className="border-b border-border/50 hover:bg-surface-hover/50"
                >
                  <td className="py-2 px-3 font-medium text-text-secondary">
                    {index + 1}
                  </td>
                  <td className="py-2 px-3 font-medium text-text-primary max-w-xs truncate">
                    <div className="flex items-center gap-2">
                      <LogoBrand
                        namaProduk={item.namaProduk}
                        jenisTransaksi="pulsa"
                        size={24}
                      />
                      <span>{item.namaProduk}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-text-primary">
                    {formatAngka(item.jumlahTerjual)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-text-primary">
                    {formatRupiah(item.totalOmzet)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
