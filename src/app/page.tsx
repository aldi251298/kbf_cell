"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getRingkasanHariIni,
  getPerbandinganRingkasan,
  getTransaksiPaginated,
} from "@/services";
import type { RingkasanHarian, Transaksi } from "@/types";
import {
  formatRupiah,
  formatAngka,
  hitungPerubahanPersen,
  getTampilanTransaksi,
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Skeleton,
  CardSkeleton,
} from "@/components/ui/skeleton";
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
import {
  Receipt,
  DollarSign,
  ShoppingCart,
  Clock,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  X,
} from "lucide-react";

// Items per page for riwayat transaksi
const ITEMS_PER_PAGE = 10;

export default function DashboardPage() {
  const [ringkasan, setRingkasan] = useState<RingkasanHarian | null>(null);
  const [perbandingan, setPerbandingan] = useState<{
    today: RingkasanHarian;
    yesterday: RingkasanHarian;
    perubahan: { omzet: number; transaksi: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Pagination state for riwayat transaksi
  const [riwayatPage, setRiwayatPage] = useState(1);
  const [totalRiwayatPages, setTotalRiwayatPages] = useState(1);
  const [totalRiwayatItems, setTotalRiwayatItems] = useState(0);
  const [riwayatTransactions, setRiwayatTransactions] = useState<Transaksi[]>(
    [],
  );
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaksi | null>(null);

  // Fetch dashboard summary data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const fetchData = async () => {
      try {
        const [ringkasanData, perbandinganData] = await Promise.all([
          getRingkasanHariIni(),
          getPerbandinganRingkasan(),
        ]);

        if (!cancelled) {
          setRingkasan(ringkasanData);
          setPerbandingan(perbandinganData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
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
  }, []);

  // Fetch riwayat transaksi when page changes
  useEffect(() => {
    let cancelled = false;
    const fetchRiwayat = async () => {
      try {
        const result = await getTransaksiPaginated(riwayatPage, ITEMS_PER_PAGE);
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

  const getCategoryIcon = (kategori: string) => {
    switch (kategori) {
      case "pulsa":
        return <Receipt className="h-4 w-4" />;
      case "data":
        return <DollarSign className="h-4 w-4" />;
      case "voucher":
        return <ShoppingCart className="h-4 w-4" />;
      case "p2p":
        return <Receipt className="h-4 w-4" />;
      case "ewallet":
        return <DollarSign className="h-4 w-4" />;
      case "ppob":
        return <DollarSign className="h-4 w-4" />;
      case "gametopup":
        return <ShoppingCart className="h-4 w-4" />;
      case "keuangan":
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  const getCategoryBadgeColor = (kategori: string) => {
    switch (kategori) {
      case "pulsa":
        return "bg-blue-50 text-blue-700";
      case "data":
        return "bg-purple-50 text-purple-700";
      case "voucher":
        return "bg-amber-50 text-amber-700";
      case "p2p":
        return "bg-green-50 text-green-700";
      case "ewallet":
        return "bg-cyan-50 text-cyan-700";
      case "ppob":
        return "bg-orange-50 text-orange-700";
      case "gametopup":
        return "bg-pink-50 text-pink-700";
      case "keuangan":
        return "bg-teal-50 text-teal-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  // Transaction Detail Modal Component
  const TransactionDetailModal = ({
    transaction,
    onClose,
  }: {
    transaction: Transaksi;
    onClose: () => void;
  }) => {
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
          return "bg-blue-50 text-blue-700";
        case "data":
          return "bg-purple-50 text-purple-700";
        case "voucher":
          return "bg-amber-50 text-amber-700";
        case "p2p":
          return "bg-green-50 text-green-700";
        case "ewallet":
          return "bg-cyan-50 text-cyan-700";
        case "ppob":
          return "bg-orange-50 text-orange-700";
        case "gametopup":
          return "bg-pink-50 text-pink-700";
        case "keuangan":
          return "bg-teal-50 text-teal-700";
        default:
          return "bg-gray-50 text-gray-700";
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              Detail Transaksi
            </h3>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-500">Status</span>
              <Badge
                variant={
                  getStatusBadgeVariant(transaction.status) as
                    "success" | "warning" | "error" | "default"
                }
                size="sm"
              >
                {transaction.status.charAt(0).toUpperCase() +
                  transaction.status.slice(1)}
              </Badge>
            </div>

            {/* Waktu */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Waktu Transaksi</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(transaction.waktu).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* Konter */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Konter</span>
              <span className="text-sm font-medium text-gray-900">
                {transaction.konterNama}
              </span>
            </div>

            {/* Produk */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Produk</span>
              <div className="flex items-center gap-2">
                <Badge
                  variant="default"
                  size="sm"
                  className={getCategoryBadgeColor(transaction.produk.kategori)}
                >
                  {transaction.produk.kategori}
                </Badge>
                <span className="text-sm font-medium text-gray-900">
                  {transaction.produk.nama}
                </span>
              </div>
            </div>

            {/* Nominal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Nominal</span>
              <span className="text-sm font-bold text-gray-900">
                {formatRupiah(transaction.nominal)}
              </span>
            </div>

            {/* Nomor Tujuan - Only show if exists and not empty */}
            {transaction.nomorTujuan && transaction.nomorTujuan !== "-" && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Nomor Tujuan</span>
                <span className="text-sm font-mono font-medium text-gray-900">
                  {transaction.nomorTujuan}
                </span>
              </div>
            )}

            {/* Serial Number */}
            {transaction.sn && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Serial Number</span>
                <span className="text-sm font-mono text-gray-900">
                  {transaction.sn}
                </span>
              </div>
            )}

            {/* Error Message */}
            {transaction.errorMessage && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-xs font-medium text-red-600 mb-1">
                  Pesan Error
                </p>
                <p className="text-sm text-red-700">
                  {transaction.errorMessage}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Ringkasan aktivitas konter pulsa Anda
          </p>
        </div>
      </div>

      {/* Summary Cards - Omzet, Transaksi, Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : ringkasan ? (
          <>
            {/* Omzet Card */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Omzet Hari Ini
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-2 tracking-tight">
                      {formatRupiah(ringkasan.totalOmzet)}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {omzetDelta > 0 ? (
                        <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                      ) : omzetDelta < 0 ? (
                        <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />
                      ) : null}
                      <span
                        className={`text-xs font-medium ${
                          omzetDelta > 0
                            ? "text-green-600"
                            : omzetDelta < 0
                              ? "text-red-600"
                              : "text-gray-500"
                        }`}
                      >
                        {hitungPerubahanPersen(
                          perbandingan?.today.totalOmzet ?? 0,
                          perbandingan?.yesterday.totalOmzet ?? 0,
                        ) > 0
                          ? "+"
                          : ""}
                        {hitungPerubahanPersen(
                          perbandingan?.today.totalOmzet ?? 0,
                          perbandingan?.yesterday.totalOmzet ?? 0,
                        ).toFixed(1)}
                        %
                      </span>
                      <span className="text-xs text-gray-400 ml-1">
                        dari kemarin
                      </span>
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaksi Card */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Transaksi Hari Ini
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-2 tracking-tight">
                      {formatAngka(ringkasan.totalTransaksi)}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {transaksiDelta > 0 ? (
                        <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                      ) : transaksiDelta < 0 ? (
                        <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />
                      ) : null}
                      <span
                        className={`text-xs font-medium ${
                          transaksiDelta > 0
                            ? "text-green-600"
                            : transaksiDelta < 0
                              ? "text-red-600"
                              : "text-gray-500"
                        }`}
                      >
                        {hitungPerubahanPersen(
                          perbandingan?.today.totalTransaksi ?? 0,
                          perbandingan?.yesterday.totalTransaksi ?? 0,
                        ) > 0
                          ? "+"
                          : ""}
                        {hitungPerubahanPersen(
                          perbandingan?.today.totalTransaksi ?? 0,
                          perbandingan?.yesterday.totalTransaksi ?? 0,
                        ).toFixed(1)}
                        %
                      </span>
                      <span className="text-xs text-gray-400 ml-1">
                        dari kemarin
                      </span>
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Transaksi Card */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Status Transaksi Hari Ini
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-xs text-gray-600">Sukses</span>
                    </div>
                    <Badge variant="success" size="sm">
                      {ringkasan.transaksiPerStatus.sukses}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="text-xs text-gray-600">Pending</span>
                    </div>
                    <Badge variant="warning" size="sm">
                      {ringkasan.transaksiPerStatus.pending}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-xs text-gray-600">Gagal</span>
                    </div>
                    <Badge variant="error" size="sm">
                      {ringkasan.transaksiPerStatus.gagal}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-8">
              <EmptyState
                title="Tidak ada data"
                description="Belum ada data transaksi untuk periode ini"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Riwayat Transaksi with Pagination */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Riwayat Transaksi</CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">
              {totalRiwayatItems} total transaksi
            </p>
          </div>
          <Link href="/transaksi">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Lihat Semua
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-xl bg-gray-50/50"
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Konter</TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead>Nominal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tujuan</TableHead>
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
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <TableCell className="whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(trx.waktu).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              <p className="text-[11px] text-gray-400">
                                {new Date(trx.waktu).toLocaleDateString("id-ID", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-gray-900">
                              {trx.konterNama}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                {getCategoryIcon(trx.produk.kategori)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {trx.produk.nama}
                                </p>
                                <Badge
                                  variant="default"
                                  size="sm"
                                  className={getCategoryBadgeColor(
                                    trx.produk.kategori,
                                  )}
                                >
                                  {tampilan.labelJenisTransaksi}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <p className="text-sm font-medium text-gray-900">
                              {formatRupiah(trx.nominal)}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                getStatusBadgeVariant(trx.status) as
                                  "success" | "warning" | "error" | "default"
                              }
                              size="sm"
                            >
                              {trx.status.charAt(0).toUpperCase() +
                                trx.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {tampilan.tampilkanNomorTujuan && trx.nomorTujuan ? (
                              <span className="text-sm text-gray-600">
                                {trx.nomorTujuan}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTransaction(trx);
                              }}
                              className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                              title="Lihat Detail"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  <TableRow className="bg-gray-50 font-semibold">
                    <TableCell colSpan={4} className="text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        Total {ITEMS_PER_PAGE} Transaksi
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <p className="text-sm font-bold text-blue-600">
                        {formatRupiah(
                          riwayatTransactions.reduce(
                            (sum, trx) => sum + trx.nominal,
                            0,
                          ),
                        )}
                      </p>
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 border-t border-border">
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
              icon={<Clock className="h-6 w-6 text-gray-400" />}
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
