"use client";

import { cn } from "@/lib/utils";
import { DollarSign, Wallet, ShoppingCart, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah, formatAngka } from "@/lib/utils";
import type { RingkasanLaporan } from "@/types/laporanAnalytics";

interface RingkasanCardsProps {
  data: RingkasanLaporan;
  loading?: boolean;
}

const CARD_CONFIG = [
  {
    key: "totalOmzet",
    label: "Total Omzet",
    icon: DollarSign,
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    formatter: formatRupiah,
  },
  {
    key: "totalPendapatanBersih",
    label: "Pendapatan Bersih",
    icon: Wallet,
    iconBg: "bg-success/10",
    iconColor: "text-success",
    formatter: formatRupiah,
  },
  {
    key: "totalTransaksi",
    label: "Jumlah Transaksi",
    icon: ShoppingCart,
    iconBg: "bg-info/10",
    iconColor: "text-info",
    formatter: formatAngka,
  },
  {
    key: "rataRataPerTransaksi",
    label: "Rata-rata per Transaksi",
    icon: TrendingUp,
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    formatter: formatRupiah,
  },
] as const;

export function RingkasanCards({ data, loading = false }: RingkasanCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-4 w-1/4 bg-surface-hover rounded mb-2" />
              <div className="h-8 w-1/2 bg-surface-hover rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {CARD_CONFIG.map(
        ({ key, label, icon: Icon, iconBg, iconColor, formatter }) => (
          <Card key={key} variant="highlight">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-text-secondary">
                  {label}
                </CardTitle>
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center",
                    iconBg,
                  )}
                >
                  <Icon className={cn("h-4 w-4", iconColor)} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-display font-bold text-text-primary tracking-tight">
                {formatter(data[key as keyof RingkasanLaporan] as number)}
              </p>
            </CardContent>
          </Card>
        ),
      )}
    </div>
  );
}
