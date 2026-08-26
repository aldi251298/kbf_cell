"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  getRingkasanHariIni,
  getPerbandinganRingkasan,
  getTransaksiPaginatedByDateRange,
  getTransaksiHariIniService,
} from "@/services";
import { useTransaksiRealtime } from "@/hooks/useTransaksiRealtime";
import type { Transaksi } from "@/types";
import type { RingkasanHarianWithSaldo } from "@/services/ringkasanService";
import {
  formatRupiah,
  formatAngka,
  hitungPerubahanPersen,
  getTampilanTransaksi,
  getDisplayProductName,
  getTodayWIBDateString,
  getRentangWaktuWIB,
  formatWaktu,
  formatJam,
  formatTanggal,
  cn,
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton, CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { LogoBrand } from "@/components/ui/LogoBrand";
import {
  WalletCards,
  ChartNoAxesCombined,
  CreditCard,
  ChartNoAxesColumnIncreasing,
  Clock,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Store,
} from "lucide-react";

// Items per page for riwayat transaksi
const ITEMS_PER_PAGE = 10;

// Day change check interval (every 5 minutes)
const DAY_CHANGE_CHECK_INTERVAL = 5 * 60 * 1000;

// Table column definitions - single source of truth for column widths
// Fixed widths for consistent columns, flexible for variable content (Produk)
const TABLE_COLUMNS = [
  {
    key: "waktu",
    label: "Waktu",
    width: "80px",
    minWidth: "80px",
    maxWidth: "100px",
    align: "left" as const,
  },
  {
    key: "konter",
    label: "Konter",
    width: "100px",
    minWidth: "100px",
    maxWidth: "100px",
    align: "left" as const,
  },
  {
    key: "produk",
    label: "Produk",
    width: "150px",
    minWidth: "150px",
    maxWidth: "150px",
    align: "left" as const,
  },
  {
    key: "tujuan",
    label: "Tujuan",
    width: "80px",
    minWidth: "80px",
    maxWidth: "80px",
    align: "left" as const,
  },
  {
    key: "nominal",
    label: "Nominal",
    width: "100px",
    minWidth: "100px",
    maxWidth: "100px",
    align: "center" as const,
  },
  {
    key: "status",
    label: "Status",
    width: "50px",
    minWidth: "50px",
    maxWidth: "50px",
    align: "center" as const,
  },
] as const;

// Transaction Detail Modal Component (moved outside to avoid react-hooks/static-components error)
function TransactionDetailModal({
  transaction,
  onClose,
}: {
  transaction: Transaksi;
  onClose: () => void;
}) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "sukses":
        return "success";
      case "pending":
        return "warning";
      case "gagal":
        return "error";
      default:
        return "default";
    }
  };

  const getCategoryBadgeColor = (kategori: string) => {
    switch (kategori) {
      case "pulsa":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "data":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "voucher":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "p2p":
        return "bg-green-50 text-green-700 border-green-100";
      case "ewallet":
        return "bg-cyan-50 text-cyan-700 border-cyan-100";
      case "ppob":
        return "bg-orange-50 text-orange-700 border-orange-100";
      case "gametopup":
        return "bg-pink-50 text-pink-700 border-pink-100";
      case "keuangan":
        return "bg-teal-50 text-teal-700 border-teal-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-border-subtle overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-subtle">
          <h3 className="text-lg font-semibold text-text-primary">
            Detail Transaksi
          </h3>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-text-tertiary hover:bg-surface-hover hover:text-text-secondary transition-colors"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Status */}
          <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl">
            <span className="text-sm text-text-tertiary">Status</span>
            <Badge
              variant={
                getStatusBadgeVariant(transaction.status) as
                  "success" | "warning" | "error" | "default"
              }
              size="sm"
              className="px-2.5 py-1 text-[11px] font-medium"
            >
              {transaction.status.charAt(0).toUpperCase() +
                transaction.status.slice(1)}
            </Badge>
          </div>

          {/* Waktu */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-tertiary">Waktu Transaksi</span>
            <span className="text-sm font-medium text-text-primary font-data">
              {formatWaktu(transaction.waktu)}
            </span>
          </div>

          {/* Konter */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-tertiary">Konter</span>
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-text-tertiary" strokeWidth={2} />
              <span className="text-sm font-medium text-text-primary">
                {transaction.konterNama}
              </span>
            </div>
          </div>

          {/* Produk */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-tertiary">Produk</span>
            <div className="flex items-center gap-2">
              <LogoBrand
                namaProduk={transaction.produk.nama}
                jenisTransaksi={transaction.produk.kategori}
                size={30}
              />
              <Badge
                variant="outline"
                size="sm"
                className={
                  getCategoryBadgeColor(transaction.produk.kategori) +
                  " text-[12px] font-medium"
                }
              >
                {
                  getTampilanTransaksi(
                    transaction.produk.kategori,
                    transaction.nomorTujuan,
                    transaction.produk.nama,
                  ).labelJenisTransaksi
                }
              </Badge>
              {getTampilanTransaksi(
                transaction.produk.kategori,
                transaction.nomorTujuan,
                transaction.produk.nama,
              ).tampilkanNamaProduk && (
                <span className="text-xl font-medium text-text-primary">
                  {getDisplayProductName(
                    transaction.produk.kategori,
                    transaction.produk.nama,
                    transaction.providerSeluler,
                  )}
                </span>
              )}
              {transaction.produk.kategori === "pulsa" &&
                !transaction.produk.nama && (
                  <span className="text-sm font-medium text-text-primary">
                    Isi Ulang Pulsa
                  </span>
                )}
            </div>
          </div>

          {/* Nominal */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-tertiary">Nominal</span>
            <span className="text-sm font-bold text-text-primary font-data">
              {formatRupiah(transaction.nominal)}
            </span>
          </div>

          {/* Nomor Tujuan - Only show if exists and not empty */}
          {transaction.nomorTujuan && transaction.nomorTujuan !== "-" && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-tertiary">
                {
                  getTampilanTransaksi(
                    transaction.produk.kategori,
                    transaction.nomorTujuan,
                    transaction.produk.nama,
                  ).labelNomorTujuan
                }
              </span>
              <span className="text-sm font-mono font-medium text-text-primary">
                {transaction.nomorTujuan}
              </span>
            </div>
          )}

          {/* Serial Number */}
          {transaction.sn && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-tertiary">Serial Number</span>
              <span className="text-sm font-mono text-text-primary">
                {transaction.sn}
              </span>
            </div>
          )}

          {/* Error Message */}
          {transaction.errorMessage && (
            <div className="p-3 bg-error/5 border border-error/20 rounded-xl">
              <p className="text-xs font-medium text-error mb-1">Pesan Error</p>
              <p className="text-sm text-error">{transaction.errorMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [ringkasan, setRingkasan] = useState<RingkasanHarianWithSaldo | null>(
    null,
  );
  const [perbandingan, setPerbandingan] = useState<{
    today: RingkasanHarianWithSaldo;
    yesterday: RingkasanHarianWithSaldo;
    perubahan: { omzet: number; transaksi: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Alpines balance state (single number, no konter filter) - now from ringkasan response
  const [saldoAlpines, setSaldoAlpines] = useState<number | null>(null);
  const [waktuSaldoAlpines, setWaktuSaldoAlpines] = useState<string | null>(
    null,
  );

  // Pagination state for riwayat transaksi
  const [riwayatPage, setRiwayatPage] = useState(1);
  const [totalRiwayatPages, setTotalRiwayatPages] = useState(1);
  const [totalRiwayatItems, setTotalRiwayatItems] = useState(0);
  const [riwayatTransactions, setRiwayatTransactions] = useState<Transaksi[]>(
    [],
  );
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaksi | null>(null);

  // Track current date for day change detection
  const [currentDateKey, setCurrentDateKey] = useState<string>(() => {
    return getTodayWIBDateString();
  });

  // Refs for realtime handling
  const ringkasanRef = useRef(ringkasan);
  const riwayatTransactionsRef = useRef(riwayatTransactions);
  const perbandinganRef = useRef(perbandingan);

  useEffect(() => {
    ringkasanRef.current = ringkasan;
  }, [ringkasan]);

  useEffect(() => {
    riwayatTransactionsRef.current = riwayatTransactions;
  }, [riwayatTransactions]);

  useEffect(() => {
    perbandinganRef.current = perbandingan;
  }, [perbandingan]);

  // Initial fetch on mount
  useEffect(() => {
    let mounted = true;
    const initFetch = async () => {
      try {
        const [ringkasanData, perbandinganData, riwayatData] =
          await Promise.all([
            getRingkasanHariIni(),
            getPerbandinganRingkasan(),
            getTransaksiHariIniService(),
          ]);

        if (mounted) {
          setRingkasan(ringkasanData);
          setPerbandingan(perbandinganData);
          setRiwayatTransactions(riwayatData);
          setTotalRiwayatItems(riwayatData.length);
          setTotalRiwayatPages(
            Math.ceil(riwayatData.length / ITEMS_PER_PAGE) || 1,
          );

          // Set Alpines balance from ringkasan response (no separate API call needed)
          setSaldoAlpines(ringkasanData?.saldoAlpinesTerkini ?? null);
          setWaktuSaldoAlpines(ringkasanData?.waktuSaldoAlpinesTerkini ?? null);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    initFetch();
    return () => {
      mounted = false;
    };
  }, []);

  // Also refetch Alpines balance when day changes (to catch new transactions)
  // Now handled by fetchDashboardData which calls getRingkasanHariIni() that includes saldo

  // Fetch dashboard summary data (for day change refetch)
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [ringkasanData, perbandinganData, riwayatData] = await Promise.all([
        getRingkasanHariIni(),
        getPerbandinganRingkasan(),
        getTransaksiHariIniService(),
      ]);
      setRingkasan(ringkasanData);
      setPerbandingan(perbandinganData);
      setRiwayatTransactions(riwayatData);
      setTotalRiwayatItems(riwayatData.length);
      setTotalRiwayatPages(Math.ceil(riwayatData.length / ITEMS_PER_PAGE) || 1);
      setRiwayatPage(1);

      // Update Alpines balance from ringkasan response
      setSaldoAlpines(ringkasanData?.saldoAlpinesTerkini ?? null);
      setWaktuSaldoAlpines(ringkasanData?.waktuSaldoAlpinesTerkini ?? null);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch riwayat transaksi when page changes (for today's transactions only)
  useEffect(() => {
    let cancelled = false;
    const fetchRiwayat = async () => {
      try {
        const todayWIB = getTodayWIBDateString();
        const result = await getTransaksiPaginatedByDateRange(
          todayWIB,
          todayWIB,
          riwayatPage,
          ITEMS_PER_PAGE,
        );
        if (!cancelled) {
          setRiwayatTransactions(result.data);
          setTotalRiwayatPages(result.totalPages);
          setTotalRiwayatItems(result.total);
        }
      } catch (error) {
        console.error("Error fetching riwayat transaksi:", error);
      }
    };
    fetchRiwayat();
    return () => {
      cancelled = true;
    };
  }, [riwayatPage]);

  // Realtime subscription for new transactions
  useTransaksiRealtime(
    useCallback(
      (newTrx: Transaksi) => {
        // Check if the new transaction falls within today's WIB range
        // Use centralized getRentangWaktuWIB utility
        const todayWIB = getTodayWIBDateString();
        const { awalUTC, akhirUTC } = getRentangWaktuWIB(todayWIB, todayWIB);

        const trxTime = new Date(newTrx.waktu).getTime();
        if (trxTime >= awalUTC.getTime() && trxTime <= akhirUTC.getTime()) {
          // Update ringkasan (summary) - increment counts
          setRingkasan((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              totalOmzet: prev.totalOmzet + newTrx.nominal,
              totalTransaksi: prev.totalTransaksi + 1,
              transaksiPerStatus: {
                ...prev.transaksiPerStatus,
                [newTrx.status]:
                  (prev.transaksiPerStatus[
                    newTrx.status as keyof typeof prev.transaksiPerStatus
                  ] ?? 0) + 1,
              },
              kontribusiPerKonter: prev.kontribusiPerKonter.map((k) =>
                k.konterId === newTrx.konterId
                  ? {
                      ...k,
                      omzet: k.omzet + newTrx.nominal,
                      jumlahTransaksi: k.jumlahTransaksi + 1,
                    }
                  : k,
              ),
            };
          });

          // Update perbandingan (today's data)
          setPerbandingan((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              today: {
                ...prev.today,
                totalOmzet: prev.today.totalOmzet + newTrx.nominal,
                totalTransaksi: prev.today.totalTransaksi + 1,
                transaksiPerStatus: {
                  ...prev.today.transaksiPerStatus,
                  [newTrx.status]:
                    (prev.today.transaksiPerStatus[
                      newTrx.status as keyof typeof prev.today.transaksiPerStatus
                    ] ?? 0) + 1,
                },
                kontribusiPerKonter: prev.today.kontribusiPerKonter.map((k) =>
                  k.konterId === newTrx.konterId
                    ? {
                        ...k,
                        omzet: k.omzet + newTrx.nominal,
                        jumlahTransaksi: k.jumlahTransaksi + 1,
                      }
                    : k,
                ),
              },
              perubahan: {
                omzet:
                  prev.today.totalOmzet +
                  newTrx.nominal -
                  prev.yesterday.totalOmzet,
                transaksi:
                  prev.today.totalTransaksi + 1 - prev.yesterday.totalTransaksi,
              },
            };
          });

          // Update Alpines balance if new transaction is from Alpines and has saldo_akhir
          if (
            newTrx.provider === "alpines" &&
            newTrx.detail?.saldo_akhir !== undefined &&
            newTrx.detail?.saldo_akhir !== null
          ) {
            setSaldoAlpines(newTrx.detail.saldo_akhir as number);
            setWaktuSaldoAlpines(
              newTrx.waktu instanceof Date
                ? newTrx.waktu.toISOString()
                : String(newTrx.waktu),
            );
          }

          // Update riwayat transactions (add to front if on page 1)
          setRiwayatTransactions((prev) => {
            // Only add to the list if we're on page 1 (showing latest transactions)
            if (riwayatPage === 1) {
              return [newTrx, ...prev].slice(0, ITEMS_PER_PAGE);
            }
            return prev;
          });

          // Update total count
          setTotalRiwayatItems((prev) => prev + 1);
        }
      },
      [riwayatPage],
    ),
    true,
  );

  // Day change detection - check every 5 minutes if date has changed
  useEffect(() => {
    const checkDayChange = () => {
      const now = new Date();
      const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
      // now.getTime() returns UTC milliseconds. Add WIB offset (UTC+7) directly.
      // Do NOT use getTimezoneOffset() - it causes double-conversion if server isn't UTC.
      const wibMs = now.getTime() + WIB_OFFSET_MS;
      const wibDate = new Date(wibMs);
      const newDateKey = `${wibDate.getUTCFullYear()}-${wibDate.getUTCMonth()}-${wibDate.getUTCDate()}`;

      if (newDateKey !== currentDateKey) {
        // Date has changed - update date key and refetch data
        setCurrentDateKey(newDateKey);
        fetchDashboardData();
        // Also refetch riwayat transactions for the new day
        setRiwayatPage(1);
      }
    };

    const interval = setInterval(checkDayChange, DAY_CHANGE_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [currentDateKey, fetchDashboardData]);

  // Calculate delta percentages
  const omzetDelta = perbandingan
    ? hitungPerubahanPersen(
        perbandingan.today.totalOmzet,
        perbandingan.yesterday.totalOmzet,
      )
    : 0;

  const transaksiDelta = perbandingan
    ? hitungPerubahanPersen(
        perbandingan.today.totalTransaksi,
        perbandingan.yesterday.totalTransaksi,
      )
    : 0;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "sukses":
        return "success";
      case "pending":
        return "warning";
      case "gagal":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-7">
      {/* Header Row - Welcome + Date Picker/Filter */}

      {/* Strip Saldo Alpines - Full width, small height, accent border */}
      <div className="relative">
        {loading ? (
          <Skeleton className="h-20 w-full rounded-lg" />
        ) : (
          <div
            className="flex items-center justify-between px-4 py-3 bg-background border border-primary/30 rounded-lg transition-colors hover:border-primary/50"
            style={{ minHeight: "64px" }}
          >
            {/* Left side: Icon + Label + Value */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-4.5 w-4.5 text-primary strokeWidth={2}" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-black uppercase tracking-wider">
                  Saldo Alpines
                </p>
                <p className="text-lg font-bold text-text-primary font-data">
                  {saldoAlpines !== null ? formatRupiah(saldoAlpines) : "—"}
                </p>
              </div>
            </div>
            {/* Right side: Last update info */}
            <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
              <Clock className="h-3.5 w-3.5" strokeWidth={2} />
              <span>
                {waktuSaldoAlpines
                  ? `Update ${new Date(waktuSaldoAlpines).toLocaleString(
                      "id-ID",
                      {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}`
                  : "—"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Summary Cards Grid - 3 columns: Total Uang Masuk, Omzet Bersih, Total Transaksi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : ringkasan ? (
          <>
            {/* Card 1: Total Uang Masuk — Emerald to Teal Gradient */}
            <Card variant="summary-income">
              <CardContent className="relative py-8">
                <div className="flex items-start justify-between">
                  <div className="pr-4">
                    <p className="text-sm font-medium text-white/80 tracking-wide uppercase">
                      Total Uang Masuk
                    </p>
                    <p className="text-4xl font-bold text-white mt-4 tracking-tight leading-none font-data">
                      {formatRupiah(ringkasan.totalOmzet)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-5">
                      {omzetDelta > 0 ? (
                        <ArrowUpRight
                          className="h-4 w-4 text-green-300"
                          strokeWidth={2}
                        />
                      ) : omzetDelta < 0 ? (
                        <ArrowDownRight
                          className="h-4 w-4 text-red-300"
                          strokeWidth={2}
                        />
                      ) : null}
                      <span
                        className={`text-sm font-semibold ${
                          omzetDelta > 0
                            ? "text-green-300"
                            : omzetDelta < 0
                              ? "text-red-300"
                              : "text-white/70"
                        }`}
                      >
                        {omzetDelta > 0 ? "+" : ""}
                        {hitungPerubahanPersen(
                          perbandingan?.today.totalOmzet ?? 0,
                          perbandingan?.yesterday.totalOmzet ?? 0,
                        ).toFixed(1)}
                        %
                      </span>
                      <span className="text-sm font-medium text-white/70">
                        vs kemarin
                      </span>
                    </div>
                  </div>
                  <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <WalletCards
                      className="h-8 w-8 text-white"
                      strokeWidth={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Omzet Bersih — Violet to Purple Gradient */}
            <Card variant="summary-revenue">
              <CardContent className="relative py-8">
                <div className="flex items-start justify-between">
                  <div className="pr-4">
                    <p className="text-sm font-medium text-white/80 tracking-wide uppercase">
                      Omzet Bersih
                    </p>
                    <p className="text-4xl font-bold text-white mt-4 tracking-tight leading-none font-data">
                      {formatRupiah(ringkasan.pendapatanBersih ?? 0)}
                    </p>
                    <p className="text-sm font-medium text-white/70 mt-5">
                      Setelah potongan biaya
                    </p>
                  </div>
                  <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <ChartNoAxesCombined
                      className="h-8 w-8 text-white"
                      strokeWidth={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Total Transaksi Hari Ini — Amber to Orange Gradient */}
            <Card variant="summary-transactions">
              <CardContent className="relative py-8">
                <div className="flex items-start justify-between">
                  <div className="pr-4">
                    <p className="text-sm font-medium text-white/80 tracking-wide uppercase">
                      Total Transaksi Hari Ini
                    </p>
                    <p className="text-4xl font-bold text-white mt-4 tracking-tight leading-none font-data">
                      {formatAngka(ringkasan.totalTransaksi)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-5">
                      {transaksiDelta > 0 ? (
                        <ArrowUpRight
                          className="h-4 w-4 text-amber-300"
                          strokeWidth={2}
                        />
                      ) : transaksiDelta < 0 ? (
                        <ArrowDownRight
                          className="h-4 w-4 text-red-300"
                          strokeWidth={2}
                        />
                      ) : null}
                      <span
                        className={`text-sm font-semibold ${
                          transaksiDelta > 0
                            ? "text-amber-300"
                            : transaksiDelta < 0
                              ? "text-red-300"
                              : "text-white/70"
                        }`}
                      >
                        {transaksiDelta > 0 ? "+" : ""}
                        {hitungPerubahanPersen(
                          perbandingan?.today.totalTransaksi ?? 0,
                          perbandingan?.yesterday.totalTransaksi ?? 0,
                        ).toFixed(1)}
                        %
                      </span>
                      <span className="text-sm font-medium text-white/70">
                        vs kemarin
                      </span>
                    </div>
                  </div>
                  <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <ChartNoAxesColumnIncreasing
                      className="h-8 w-8 text-white"
                      strokeWidth={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-12">
              <EmptyState
                title="Tidak ada data"
                description="Belum ada data transaksi untuk periode ini"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Riwayat Transaksi with Pagination */}
      <Card variant="default">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-text-tertiary">
              Riwayat Transaksi Hari Ini
            </CardTitle>
            <p className="text-xs text-text-tertiary mt-0.5">
              {totalRiwayatItems} total transaksi
            </p>
          </div>
          <Link href="/transaksi">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg border-border text-xs font-medium text-text-secondary hover:bg-surface-hover"
            >
              Lihat Semua
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" strokeWidth={2} />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-6 py-4 rounded-xl bg-surface-secondary/50"
                >
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-4 w-20 ml-auto" />
                </div>
              ))}
            </div>
          ) : riwayatTransactions.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-[820px]">
                  <TableHeader>
                    <TableRow className="bg-surface-secondary/50 border-b border-border">
                      {TABLE_COLUMNS.map((col) => (
                        <TableHead
                          key={col.key}
                          className={cn(
                            "whitespace-nowrap",
                            col.align === "left" && "text-left",
                            col.align === "center" && "text-center",
                          )}
                          style={{
                            minWidth: col.minWidth,
                            maxWidth: col.maxWidth,
                            width: col.width,
                          }}
                        >
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riwayatTransactions.map((trx) => {
                      const tampilan = getTampilanTransaksi(
                        trx.produk.kategori,
                        trx.nomorTujuan,
                        trx.produk.nama,
                      );
                      return (
                        <TableRow
                          key={trx.id}
                          onClick={() => setSelectedTransaction(trx)}
                          className="cursor-pointer hover:bg-surface-hover/50 transition-colors border-t border-border-subtle"
                        >
                          {TABLE_COLUMNS.map((col) => {
                            const alignClass = cn(
                              col.align === "left" && "text-left",
                              col.align === "center" && "text-center",
                            );
                            const widthStyle = {
                              minWidth: col.minWidth,
                              maxWidth: col.maxWidth,
                              width: col.width,
                            };

                            switch (col.key) {
                              case "waktu":
                                return (
                                  <TableCell
                                    key={col.key}
                                    className={cn(
                                      "whitespace-nowrap py-4",
                                      alignClass,
                                    )}
                                    style={widthStyle}
                                  >
                                    <div className="flex flex-col">
                                      <p className="text-sm font-medium text-text-primary">
                                        {formatTanggal(trx.waktu)}
                                      </p>
                                      <p className="text-xs text-text-tertiary">
                                        {formatJam(trx.waktu)}
                                      </p>
                                    </div>
                                  </TableCell>
                                );
                              case "konter":
                                return (
                                  <TableCell
                                    key={col.key}
                                    className={cn("py-4 truncate", alignClass)}
                                    style={widthStyle}
                                  >
                                    <p className="text-sm text-text-primary truncate">
                                      {trx.konterNama}
                                    </p>
                                  </TableCell>
                                );
                              case "produk":
                                return (
                                  <TableCell
                                    key={col.key}
                                    className={cn("py-4", alignClass)}
                                    style={widthStyle}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <LogoBrand
                                        namaProduk={trx.produk.nama}
                                        jenisTransaksi={trx.produk.kategori}
                                        size={24}
                                      />
                                      <div className="min-w-0 flex-1 flex flex-col gap-1">
                                        {tampilan.tampilkanNamaProduk && (
                                          <span className="text-sm text-text-primary truncate">
                                            {getDisplayProductName(
                                              trx.produk.kategori,
                                              trx.produk.nama,
                                              trx.providerSeluler,
                                            )}
                                          </span>
                                        )}
                                        {trx.produk.kategori === "pulsa" &&
                                          !trx.produk.nama && (
                                            <span className="text-sm text-text-primary truncate">
                                              Isi Ulang Pulsa
                                            </span>
                                          )}
                                        <span className="text-xs text-text-tertiary">
                                          {tampilan.labelJenisTransaksi}
                                        </span>
                                      </div>
                                    </div>
                                  </TableCell>
                                );
                              case "tujuan":
                                return (
                                  <TableCell
                                    key={col.key}
                                    className={cn("py-4 truncate", alignClass)}
                                    style={widthStyle}
                                  >
                                    {tampilan.tampilkanNomorTujuan &&
                                    trx.nomorTujuan ? (
                                      <span className="text-sm text-text-primary font-mono truncate block">
                                        {trx.nomorTujuan}
                                      </span>
                                    ) : (
                                      <span className="text-sm text-text-tertiary">
                                        —
                                      </span>
                                    )}
                                  </TableCell>
                                );
                              case "nominal":
                                return (
                                  <TableCell
                                    key={col.key}
                                    className={cn(
                                      "whitespace-nowrap py-4 font-data",
                                      alignClass,
                                    )}
                                    style={widthStyle}
                                  >
                                    <p className="text-sm font-medium text-text-primary">
                                      {formatRupiah(trx.nominal)}
                                    </p>
                                  </TableCell>
                                );
                              case "status":
                                return (
                                  <TableCell
                                    key={col.key}
                                    className={cn("py-4", alignClass)}
                                    style={widthStyle}
                                  >
                                    <Badge
                                      variant={
                                        getStatusBadgeVariant(trx.status) as
                                          | "success"
                                          | "warning"
                                          | "error"
                                          | "default"
                                      }
                                      size="sm"
                                      className="w-full justify-center"
                                    >
                                      {trx.status.charAt(0).toUpperCase() +
                                        trx.status.slice(1)}
                                    </Badge>
                                  </TableCell>
                                );
                              default:
                                return null;
                            }
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-border-subtle">
                <Pagination
                  currentPage={riwayatPage}
                  totalPages={totalRiwayatPages}
                  onPageChange={setRiwayatPage}
                  totalItems={totalRiwayatItems}
                  itemsPerPage={ITEMS_PER_PAGE}
                />
              </div>
            </>
          ) : (
            <EmptyState
              icon={
                <Clock className="h-6 w-6 text-text-tertiary" strokeWidth={2} />
              }
              title="Belum ada transaksi"
              description="Transaksi akan muncul di sini saat ada aktivitas"
            />
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}
