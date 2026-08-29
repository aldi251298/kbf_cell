"use client";

import { useState, useEffect } from "react";
import {
  getTransaksiPaginatedByDateRange,
  exportTransaksiExcel,
  generateExportFilename,
} from "@/services";
import type { Transaksi, StatusTransaksi } from "@/types";
import {
  formatRupiah,
  formatWaktu,
  formatTanggal,
  formatJam,
  getTampilanTransaksi,
  getDisplayProductName,
} from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoBrand } from "@/components/ui/LogoBrand";
import { Search, X, Download, Receipt, Filter } from "lucide-react";
import { STATUS_LABELS } from "@/constants/statusTransaksi";
import { getKonterList } from "@/services";
import type { Konter } from "@/types";
import { useUserProfile } from "@/lib/useUserProfile";
import { apiFetch } from "@/lib/api-client";

// Constants
const ITEMS_PER_PAGE = 20;

type SortField = "waktu" | "nominal";
type SortDirection = "asc" | "desc";

function namaKonter(id: string | null | undefined): string {
  if (!id) return "—";
  const map: Record<string, string> = {
    "KONTER-001": "KBF Cell Pasar Baru",
    "KONTER-002": "Konter 2",
    "KONTER-003": "Konter 3",
  };
  return map[id] ?? id;
}

// Helper functions (shared between modal and table)
function getStatusBadgeVariant(
  status: string,
): "success" | "warning" | "error" | "default" {
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
}

function getCategoryBadgeColor(kategori: string): string {
  switch (kategori) {
    case "pulsa":
      return "bg-blue-50 text-blue-700";
    case "paket_nelpon":
      return "bg-purple-50 text-purple-700";
    case "paket_data":
    case "data":
      return "bg-purple-50 text-purple-700";
    case "voucher":
      return "bg-amber-50 text-amber-700";
    case "voucher_fisik":
      return "bg-amber-50 text-amber-700";
    case "p2p":
      return "bg-green-50 text-green-700";
    case "ewallet":
    case "ewallet_dana":
      return "bg-cyan-50 text-cyan-700";
    case "pln":
    case "ppob":
      return "bg-orange-50 text-orange-700";
    case "game_topup":
    case "gametopup":
      return "bg-pink-50 text-pink-700";
    case "wifi":
      return "bg-indigo-50 text-indigo-700";
    case "tv_kabel":
      return "bg-teal-50 text-teal-700";
    case "pdam":
      return "bg-sky-50 text-sky-700";
    case "token_listrik_reseller":
      return "bg-amber-50 text-amber-700";
    case "pulsa_op":
      return "bg-blue-50 text-blue-700";
    case "keuangan":
      return "bg-emerald-50 text-emerald-700";
    case "aksesoris":
      return "bg-indigo-50 text-indigo-700";
    case "belum_dikenal":
      return "bg-yellow-50 text-yellow-700";
    default:
      if (kategori.startsWith("lainnya_")) {
        return "bg-gray-50 text-gray-700";
      }
      return "bg-gray-50 text-gray-700";
  }
}

// Transaction Detail Modal Component
function TransactionDetailModal({
  transaction,
  onClose,
}: {
  transaction: Transaksi;
  onClose: () => void;
}) {
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
              {STATUS_LABELS[transaction.status]}
            </Badge>
          </div>

          {/* Waktu */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Waktu Transaksi</span>
            <span className="text-sm font-medium text-gray-900">
              {formatWaktu(transaction.waktu)}
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
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <LogoBrand
                  namaProduk={transaction.produk.nama}
                  jenisTransaksi={transaction.produk.kategori}
                  providerSeluler={transaction.providerSeluler}
                  size={28}
                />
                <Badge
                  variant="default"
                  size="sm"
                  className={getCategoryBadgeColor(transaction.produk.kategori)}
                >
                  {
                    getTampilanTransaksi(
                      transaction.produk.kategori,
                      transaction.nomorTujuan,
                      transaction.produk.nama,
                    ).labelJenisTransaksi
                  }
                </Badge>
                {transaction.perluReview && (
                  <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-[10px] font-semibold rounded">
                    PERLU REVIEW
                  </span>
                )}
              </div>
              {getTampilanTransaksi(
                transaction.produk.kategori,
                transaction.nomorTujuan,
                transaction.produk.nama,
              ).tampilkanNamaProduk && (
                <span className="text-sm font-medium text-gray-900">
                  {getDisplayProductName(
                    transaction.produk.kategori,
                    transaction.produk.nama,
                    transaction.providerSeluler,
                  )}
                </span>
              )}
              {transaction.produk.kategori === "pulsa" &&
                !transaction.produk.nama && (
                  <span className="text-sm font-medium text-gray-900">
                    Isi Ulang Pulsa
                  </span>
                )}
            </div>
          </div>

          {/* Provider Seluler (khusus pulsa) */}
          {transaction.providerSeluler && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Provider</span>
              <span className="text-sm font-medium text-gray-900">
                {transaction.providerSeluler}
              </span>
            </div>
          )}

          {/* Nama Pemilik (khusus e-wallet) */}
          {transaction.namaPemilik && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Nama Pemilik</span>
              <span className="text-sm font-medium text-gray-900">
                {transaction.namaPemilik}
              </span>
            </div>
          )}

          {/* Nominal */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-black-500">Nominal</span>
            <span className="text-sm font-bold text-gray-900">
              {formatRupiah(transaction.nominal)}
            </span>
          </div>

          {/* Nomor Tujuan - label changes based on jenis_transaksi */}
          {transaction.nomorTujuan && transaction.nomorTujuan !== "-" && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {
                  getTampilanTransaksi(
                    transaction.produk.kategori,
                    transaction.nomorTujuan,
                    transaction.produk.nama,
                  ).labelNomorTujuan
                }
              </span>
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
              <p className="text-sm text-red-700">{transaction.errorMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TransaksiPage() {
  const { profile, loading: profileLoading } = useUserProfile();

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKonter, setSelectedKonter] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedJenisTransaksi, setSelectedJenisTransaksi] =
    useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Sort states (kept for API compatibility — sort UI removed in redesign)
  const [sortField] = useState<SortField>("waktu");
  const [sortDirection] = useState<SortDirection>("desc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Data states
  const [transactions, setTransactions] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [konterList, setKonterList] = useState<Konter[]>([]);

  // Dynamic categories state
  const [dynamicCategories, setDynamicCategories] = useState<
    Array<{ kode: string; label_tampilan: string }>
  >([]);

  // Detail modal state
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaksi | null>(null);

  // Effective konter filter based on role
  const konterEfektif =
    profile?.role === "operator"
      ? profile.konterId!
      : selectedKonter || undefined;

  // Fetch konter list
  useEffect(() => {
    getKonterList().then(setKonterList);
  }, []);

  // Fetch dynamic categories
  useEffect(() => {
    const fetchDynamicCategories = async () => {
      try {
        const res = await apiFetch("/api/kategori-dinamis");
        if (res.ok) {
          const json = await res.json();
          setDynamicCategories(json.data ?? []);
        }
      } catch (error) {
        console.error("Error fetching dynamic categories:", error);
      }
    };
    fetchDynamicCategories();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Resetting page on filter change is a valid pattern
    setCurrentPage(1);
  }, [
    dateFrom,
    dateTo,
    selectedKonter,
    selectedStatus,
    selectedJenisTransaksi,
    searchTerm,
  ]);

  // Fetch transactions with proper dependencies
  useEffect(() => {
    if (profileLoading) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial loading state before fetch is a valid pattern
    setLoading(true);
    const fetchTransactions = async () => {
      try {
        // Use centralized getRentangWaktuWIB utility for correct date range handling
        const filters = {
          ...(konterEfektif && { konterId: konterEfektif }),
          ...(selectedStatus && { status: selectedStatus as StatusTransaksi }),
          ...(selectedJenisTransaksi && {
            jenisTransaksi: selectedJenisTransaksi,
          }),
          ...(searchTerm && { search: searchTerm }),
          sortBy: sortField,
          sortOrder: sortDirection,
        };

        const result = await getTransaksiPaginatedByDateRange(
          dateFrom || "",
          dateTo || "",
          currentPage,
          ITEMS_PER_PAGE,
          filters,
        );

        if (!cancelled) {
          setTransactions(result.data);
          setTotalPages(result.totalPages);
          setTotalItems(result.total);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    fetchTransactions();
    return () => {
      cancelled = true;
    };
  }, [
    currentPage,
    dateFrom,
    dateTo,
    selectedKonter,
    selectedStatus,
    selectedJenisTransaksi,
    searchTerm,
    sortField,
    sortDirection,
    konterEfektif,
    profileLoading,
  ]);

  // Handle export
  const handleExport = async () => {
    setExporting(true);
    try {
      // Use centralized getRentangWaktuWIB utility for correct date range handling
      // Export uses the active date range from the filter
      const additionalFilters = {
        ...(konterEfektif && { konterId: konterEfektif }),
        ...(selectedStatus && { status: selectedStatus as StatusTransaksi }),
        ...(selectedJenisTransaksi && {
          jenisTransaksi: selectedJenisTransaksi,
        }),
        ...(searchTerm && { search: searchTerm }),
      };

      const blob = await exportTransaksiExcel(
        dateFrom || "",
        dateTo || "",
        additionalFilters,
      );
      const filename = generateExportFilename({
        ...additionalFilters,
        startDate: dateFrom ? new Date(dateFrom) : undefined,
        endDate: dateTo ? new Date(dateTo) : undefined,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting transactions:", error);
    } finally {
      setExporting(false);
    }
  };

  // Konter options for filter
  const konterOptions = [
    { value: "", label: "Semua Konter" },
    ...konterList.map((k) => ({ value: k.id, label: k.nama })),
  ];

  // Status options for filter
  const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "sukses", label: "Sukses" },
    { value: "gagal", label: "Gagal" },
    { value: "pending", label: "Pending" },
  ];

  // Jenis transaksi options for filter — must match actual jenis_transaksi values in DB
  // Includes static known types + dynamic categories from backend
  const staticJenisTransaksiOptions = [
    { value: "", label: "Semua Jenis" },
    { value: "pulsa", label: "Pulsa" },
    { value: "paket_nelpon", label: "Paket Nelpon/SMS" },
    { value: "paket_data", label: "Paket Data" },
    { value: "pln", label: "PLN / Token Listrik" },
    { value: "ewallet", label: "E-Wallet" },
    { value: "voucher", label: "Voucher" },
    { value: "voucher_fisik", label: "Voucher Fisik Internet" },
    { value: "pulsa_op", label: "Pulsa Operator" },
    { value: "game_topup", label: "Top Up Game" },
    { value: "wifi", label: "Internet / WiFi" },
    { value: "tv_kabel", label: "TV Kabel" },
    { value: "pdam", label: "PDAM / Air" },
    { value: "token_listrik_reseller", label: "Token Listrik Reseller" },
    { value: "belum_dikenal", label: "Belum Dikenal" },
  ];

  // Merge static options with dynamic categories (avoid duplicates)
  const dynamicOptions = dynamicCategories
    .filter(
      (cat) =>
        !staticJenisTransaksiOptions.some((opt) => opt.value === cat.kode),
    )
    .map((cat) => ({ value: cat.kode, label: cat.label_tampilan }));

  const jenisTransaksiOptions = [
    ...staticJenisTransaksiOptions,
    ...dynamicOptions,
  ];

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedKonter("");
    setSelectedStatus("");
    setSelectedJenisTransaksi("");
    setDateFrom("");
    setDateTo("");
  };

  // Check if any filter is active
  const hasActiveFilters =
    searchTerm || selectedKonter || selectedStatus || dateFrom || dateTo;

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary tracking-tight">
              Transaksi
            </h1>
            <p className="text-text-secondary mt-1 text-sm">
              Riwayat lengkap semua transaksi konter pulsa
            </p>
          </div>
        </div>
        <div className="h-16 bg-white border-b rounded-2xl animate-pulse" />
        <div className="h-24 bg-white rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary tracking-tight">
            Transaksi
          </h1>
          <p className="text-text-secondary mt-1 text-sm">
            Riwayat lengkap semua transaksi konter pulsa
          </p>
        </div>

        {/* Export Button */}
        <Button
          variant="outline"
          onClick={handleExport}
          isLoading={exporting}
          icon={<Download className="h-4 w-4" />}
          disabled={loading && transactions.length === 0}
        >
          Export Excel
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search & Quick Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <Input
                  placeholder="Cari nomor tujuan atau produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
                {searchTerm && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground transition-colors duration-150"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Konter Filter - Admin only, Operator sees locked konter */}
              {profile?.role === "admin" ? (
                <Select
                  options={konterOptions}
                  value={selectedKonter}
                  onChange={setSelectedKonter}
                  placeholder="Pilih Konter"
                  className="w-full sm:w-48"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Konter:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {namaKonter(konterEfektif)}
                  </span>
                </div>
              )}

              {/* Status Filter */}
              <Select
                options={statusOptions}
                value={selectedStatus}
                onChange={setSelectedStatus}
                placeholder="Status"
                className="w-full sm:w-40"
              />

              {/* Jenis Transaksi Filter */}
              <Select
                options={jenisTransaksiOptions}
                value={selectedJenisTransaksi}
                onChange={setSelectedJenisTransaksi}
                placeholder="Jenis Transaksi"
                className="w-full sm:w-48"
              />
            </div>

            {/* Date Range & Clear */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-text-tertiary whitespace-nowrap">
                    Dari:
                  </label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-text-tertiary whitespace-nowrap">
                    Sampai:
                  </label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-40"
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  icon={<X className="h-4 w-4" />}
                >
                  Hapus Filter
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Info */}
      {!loading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-tertiary">
            Menampilkan{" "}
            <span className="font-medium text-text-secondary">
              {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)}
            </span>{" "}
            -{" "}
            <span className="font-medium text-text-secondary">
              {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}
            </span>{" "}
            dari{" "}
            <span className="font-medium text-text-secondary">
              {totalItems}
            </span>{" "}
            transaksi
          </p>

          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-text-tertiary" />
              <span className="text-sm text-text-tertiary">Filter aktif</span>
            </div>
          )}
        </div>
      )}

      {/* Transaction Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
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
        ) : transactions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                    <th className="px-6 py-3 font-medium whitespace-nowrap">
                      Waktu
                    </th>
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
                  {transactions.map((trx) => {
                    const tampilan = getTampilanTransaksi(
                      trx.produk.kategori,
                      trx.nomorTujuan,
                      trx.produk.nama,
                    );
                    return (
                      <tr
                        key={trx.id}
                        onClick={() => setSelectedTransaction(trx)}
                        className={`border-t border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer ${trx.perluReview ? "bg-yellow-50/50" : ""}`}
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
                              trx.status === "sukses"
                                ? "success"
                                : trx.status === "gagal"
                                  ? "error"
                                  : "warning"
                            }
                            size="sm"
                            dot
                          >
                            {trx.status.charAt(0).toUpperCase() +
                              trx.status.slice(1)}
                          </Badge>
                          {trx.errorMessage && (
                            <p
                              className="text-xs text-gray-400 mt-1 truncate"
                              title={trx.errorMessage}
                            >
                              {trx.errorMessage}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Info Bar */}
            <div className="flex items-center justify-between px-6 py-4 text-sm text-gray-500 border-t border-gray-100">
              <span>Total {transactions.length} transaksi</span>
              <span className="font-semibold text-gray-900 font-data">
                {formatRupiah(
                  transactions.reduce((sum, trx) => sum + trx.nominal, 0),
                )}
              </span>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-100">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </div>
          </>
        ) : (
          <div className="p-12">
            <EmptyState
              icon={<Receipt className="h-6 w-6 text-gray-400" />}
              title="Tidak ada transaksi ditemukan"
              description={
                hasActiveFilters
                  ? "Coba ubah atau hapus filter untuk melihat transaksi"
                  : "Belum ada transaksi. Transaksi akan muncul saat ada aktivitas konter."
              }
              actionLabel={hasActiveFilters ? "Hapus Filter" : undefined}
              onAction={hasActiveFilters ? clearFilters : undefined}
            />
          </div>
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
