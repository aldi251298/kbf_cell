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
  getTampilanTransaksi,
  getDisplayProductName,
  getTodayWIBDateString,
  getRentangWaktuWIB,
  formatWaktu,
  formatJam,
  formatTanggal,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton, CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { LogoBrand } from "@/components/ui/LogoBrand";
import { useUserProfile } from "@/lib/useUserProfile";
import {
  WalletCards,
  ChartNoAxesCombined,
  CreditCard,
  ChartNoAxesColumnIncreasing,
  Clock,
  ExternalLink,
  X,
  Store,
  User,
} from "lucide-react";

// Items per page for riwayat transaksi
const ITEMS_PER_PAGE = 10;

// Day change check interval (every 5 minutes)
const DAY_CHANGE_CHECK_INTERVAL = 5 * 60 * 1000;

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
      case "aksesoris":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
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

function namaKonter(id: string | null | undefined): string {
  if (!id) return "—";
  const map: Record<string, string> = {
    "KONTER-001": "KBF Cell Pasar Baru",
    "KONTER-002": "Konter 2",
    "KONTER-003": "Konter 3",
  };
  return map[id] ?? id;
}

export default function DashboardPage() {
  const { profile, loading: profileLoading } = useUserProfile();
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

  // Filter state for konter (admin only)
  const [filterKonter, setFilterKonter] = useState<string>("semua");

  // Effective konter filter based on role
  const konterEfektif =
    profile?.role === "operator" ? profile.konterId! : filterKonter;

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
    if (profileLoading) return;
    let mounted = true;
    const initFetch = async () => {
      try {
        const [ringkasanData, perbandinganData, riwayatData] =
          await Promise.all([
            getRingkasanHariIni(
              konterEfektif === "semua" ? undefined : konterEfektif,
            ),
            getPerbandinganRingkasan(
              konterEfektif === "semua" ? undefined : konterEfektif,
            ),
            getTransaksiHariIniService(
              konterEfektif === "semua" ? undefined : konterEfektif,
            ),
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
  }, [profile, profileLoading, konterEfektif]);

  // Also refetch Alpines balance when day changes (to catch new transactions)
  // Now handled by fetchDashboardData which calls getRingkasanHariIni() that includes saldo

  // Fetch dashboard summary data (for day change refetch)
  const fetchDashboardData = useCallback(async () => {
    if (profileLoading) return;
    setLoading(true);
    try {
      const [ringkasanData, perbandinganData, riwayatData] = await Promise.all([
        getRingkasanHariIni(
          konterEfektif === "semua" ? undefined : konterEfektif,
        ),
        getPerbandinganRingkasan(
          konterEfektif === "semua" ? undefined : konterEfektif,
        ),
        getTransaksiHariIniService(
          konterEfektif === "semua" ? undefined : konterEfektif,
        ),
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
  }, [konterEfektif, profileLoading]);

  // Fetch riwayat transaksi when page changes (for today's transactions only)
  useEffect(() => {
    if (profileLoading) return;
    let cancelled = false;
    const fetchRiwayat = async () => {
      try {
        const todayWIB = getTodayWIBDateString();
        const result = await getTransaksiPaginatedByDateRange(
          todayWIB,
          todayWIB,
          riwayatPage,
          ITEMS_PER_PAGE,
          { konterId: konterEfektif === "semua" ? undefined : konterEfektif },
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
  }, [riwayatPage, konterEfektif, profileLoading]);

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
          // For operator, only process if it's their konter
          if (
            profile?.role === "operator" &&
            newTrx.konterId !== profile.konterId
          ) {
            return;
          }

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
      [riwayatPage, profile],
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
    <div className="space-y-6">
      {/* Row Card Ringkasan — 4 card sejajar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : ringkasan ? (
          <>
            {/* Card 1: Total Uang Masuk */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                  <WalletCards className="h-5 w-5" strokeWidth={2} />
                </div>
                <p className="text-sm text-gray-500">Total Uang Masuk</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 font-data">
                {formatRupiah(ringkasan.totalOmzet)}
              </p>
            </div>

            {/* Card 2: Omzet Bersih */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600">
                  <ChartNoAxesCombined className="h-5 w-5" strokeWidth={2} />
                </div>
                <p className="text-sm text-gray-500">Omzet Bersih</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 font-data">
                {formatRupiah(ringkasan.pendapatanBersih ?? 0)}
              </p>
            </div>

            {/* Card 3: Total Transaksi */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center bg-purple-100 text-purple-600">
                  <ChartNoAxesColumnIncreasing
                    className="h-5 w-5"
                    strokeWidth={2}
                  />
                </div>
                <p className="text-sm text-gray-500">Total Transaksi</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 font-data">
                {formatAngka(ringkasan.totalTransaksi)}
              </p>
            </div>

            {/* Card 4: Saldo Alpines — gradient biru menonjol */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-md">
              <p className="text-sm text-blue-100 mb-1">Saldo Alpines</p>
              <p className="text-2xl font-bold mb-3 font-data">
                {saldoAlpines !== null ? formatRupiah(saldoAlpines) : "..."}
              </p>
              <div className="flex items-center gap-1 text-xs text-blue-100 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Aktif
              </div>
              <div className="flex items-center gap-1.5 text-xs text-blue-200">
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
          </>
        ) : (
          <div className="col-span-full bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="py-12">
              <EmptyState
                title="Tidak ada data"
                description="Belum ada data transaksi untuk periode ini"
              />
            </div>
          </div>
        )}
      </div>

      {/* Filter Konter (Admin only) */}
      {profile?.role === "admin" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              Filter Konter:
            </span>
            <select
              value={filterKonter}
              onChange={(e) => setFilterKonter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="semua">Semua Konter</option>
              <option value="KONTER-001">
                KONTER-001 (KBF Cell Pasar Baru)
              </option>
              <option value="KONTER-002">KONTER-002</option>
              <option value="KONTER-003">KONTER-003</option>
            </select>
          </div>
        </div>
      )}

      {/* Operator info display */}
      {profile?.role === "operator" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">Konter:</span>
            <span className="text-sm font-medium text-gray-900">
              {namaKonter(profile.konterId)}
            </span>
          </div>
        </div>
      )}

      {/* Riwayat Transaksi Terakhir */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CreditCard
              className="h-[18px] w-[18px] text-blue-600"
              strokeWidth={2}
            />
            <h2 className="font-semibold text-gray-900">
              Riwayat Transaksi Terakhir
            </h2>
          </div>
          <Link
            href="/transaksi"
            className="text-sm border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 flex items-center gap-1 text-gray-600 transition-colors"
          >
            Lihat Semua Transaksi
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-6 py-4 rounded-xl bg-gray-50/50"
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
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                    <th className="px-6 py-3 font-medium">Waktu</th>
                    <th className="px-6 py-3 font-medium">Konter</th>
                    <th className="px-6 py-3 font-medium">Produk</th>
                    <th className="px-6 py-3 font-medium">Tujuan</th>
                    <th className="px-6 py-3 font-medium text-right">
                      Nominal
                    </th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayatTransactions.map((trx) => {
                    const tampilan = getTampilanTransaksi(
                      trx.produk.kategori,
                      trx.nomorTujuan,
                      trx.produk.nama,
                    );
                    return (
                      <tr
                        key={trx.id}
                        onClick={() => setSelectedTransaction(trx)}
                        className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {formatTanggal(trx.waktu)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatJam(trx.waktu)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <span className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center text-xs">
                              🏪
                            </span>
                            {trx.konterNama}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-2 text-sm text-gray-900 font-medium">
                            <LogoBrand
                              namaProduk={trx.produk.nama}
                              jenisTransaksi={trx.produk.kategori}
                              providerSeluler={trx.providerSeluler}
                              size={24}
                            />
                            {tampilan.tampilkanNamaProduk
                              ? getDisplayProductName(
                                  trx.produk.kategori,
                                  trx.produk.nama,
                                  trx.providerSeluler,
                                )
                              : tampilan.labelJenisTransaksi}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {tampilan.tampilkanNomorTujuan && trx.nomorTujuan
                            ? trx.nomorTujuan
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right whitespace-nowrap font-data">
                          {formatRupiah(trx.nominal)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              getStatusBadgeVariant(trx.status) as
                                "success" | "warning" | "error" | "default"
                            }
                            size="sm"
                            dot
                          >
                            {trx.status.charAt(0).toUpperCase() +
                              trx.status.slice(1)}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-100">
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
            icon={<Clock className="h-6 w-6 text-gray-400" strokeWidth={2} />}
            title="Belum ada transaksi"
            description="Transaksi akan muncul di sini saat ada aktivitas"
          />
        )}
      </div>

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
