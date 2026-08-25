"use client";

import { useState, useEffect } from "react";
import {
  getTransaksiPaginated,
  exportTransaksiExcel,
  generateExportFilename,
} from "@/services";
import type { Transaksi, StatusTransaksi } from "@/types";
import {
  formatRupiah,
  formatWaktu,
  potongTeks,
  getTampilanTransaksi,
} from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  SortableTableHead,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  Search,
  X,
  Download,
  Receipt,
  Filter,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { STATUS_LABELS } from "@/constants/statusTransaksi";
import { getKonterList } from "@/services";
import type { Konter } from "@/types";

// Constants
const ITEMS_PER_PAGE = 20;

type SortField = "waktu" | "nominal";
type SortDirection = "asc" | "desc";

// Helper functions
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
                  {transaction.produk.nama}
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
            <span className="text-sm text-gray-500">Nominal</span>
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

          {/* Alasan Review */}
          {transaction.detailTambahan?.alasan_review && (
            <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
              <p className="text-xs font-medium text-yellow-600 mb-1">
                Alasan Perlu Review
              </p>
              <p className="text-sm text-yellow-700">
                {transaction.detailTambahan.alasan_review as string}
              </p>
            </div>
          )}

          {/* Raw Text History */}
          {transaction.detailTambahan?.raw_text_history && (
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
              <p className="text-xs font-medium text-gray-600 mb-1">
                Riwayat Notifikasi (
                {
                  (transaction.detailTambahan.raw_text_history as string[])
                    .length
                }
                )
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(transaction.detailTambahan.raw_text_history as string[]).map(
                  (text, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-gray-700 p-2 bg-white rounded border border-gray-200"
                    >
                      <span className="font-medium text-gray-500">
                        #{idx + 1}:
                      </span>{" "}
                      {text}
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TransaksiPendingPage() {
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKonter, setSelectedKonter] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("pending");
  const [selectedJenisTransaksi, setSelectedJenisTransaksi] =
    useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Sort states
  const [sortField, setSortField] = useState<SortField>("waktu");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

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

  // Fetch konter list
  useEffect(() => {
    getKonterList().then(setKonterList);
  }, []);

  // Fetch dynamic categories
  useEffect(() => {
    const fetchDynamicCategories = async () => {
      try {
        const res = await fetch("/api/kategori-dinamis");
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
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial loading state before fetch is a valid pattern
    setLoading(true);
    const fetchTransactions = async () => {
      try {
        // WIB = UTC+7 — adjust date inputs so they match Indonesia local date
        const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
        const toWIBStart = (dateStr: string) => {
          const d = new Date(dateStr);
          const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
          const wibMs = utcMs + WIB_OFFSET_MS;
          const wibDate = new Date(wibMs);
          const result = new Date(
            Date.UTC(
              wibDate.getUTCFullYear(),
              wibDate.getUTCMonth(),
              wibDate.getUTCDate(),
            ),
          );
          return new Date(result.getTime() - WIB_OFFSET_MS);
        };

        const filters = {
          ...(dateFrom && { startDate: toWIBStart(dateFrom) }),
          ...(dateTo && { endDate: toWIBStart(dateTo) }),
          ...(selectedKonter && { konterId: selectedKonter }),
          ...(selectedStatus && { status: selectedStatus as StatusTransaksi }),
          ...(selectedJenisTransaksi && {
            jenisTransaksi: selectedJenisTransaksi,
          }),
          ...(searchTerm && { search: searchTerm }),
          sortBy: sortField,
          sortOrder: sortDirection,
        };

        const result = await getTransaksiPaginated(
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
  ]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Handle export
  const handleExport = async () => {
    setExporting(true);
    try {
      // Use centralized getRentangWaktuWIB utility for correct date range handling
      // Export uses the active date range from the filter
      const additionalFilters = {
        ...(selectedKonter && { konterId: selectedKonter }),
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

  // Status options for filter - only pending and gagal for this page
  const statusOptions = [
    { value: "", label: "Semua Status (Pending & Gagal)" },
    { value: "pending", label: "Pending" },
    { value: "gagal", label: "Gagal" },
  ];

  // Jenis transaksi options for filter
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
    setSelectedStatus("pending");
    setSelectedJenisTransaksi("");
    setDateFrom("");
    setDateTo("");
  };

  // Check if any filter is active
  const hasActiveFilters =
    searchTerm || selectedKonter || selectedStatus || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-display font-bold text-text-primary tracking-tight">
              Transaksi Pending & Bermasalah
            </h1>
            <Badge variant="warning" size="sm" dot>
              <AlertTriangle className="h-3 w-3" />
              Perlu Perhatian
            </Badge>
          </div>
          <p className="text-text-secondary mt-1 text-sm">
            Transaksi dengan status pending atau gagal — belum masuk laporan
            omzet utama
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

              {/* Konter Filter */}
              <Select
                options={konterOptions}
                value={selectedKonter}
                onChange={setSelectedKonter}
                placeholder="Pilih Konter"
                className="w-full sm:w-48"
              />

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
      <Card>
        {loading ? (
          <CardContent className="pt-6">
            <TableSkeleton rows={5} columns={7} />
          </CardContent>
        ) : transactions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead
                      sortable
                      sorted={sortField === "waktu" ? sortDirection : null}
                      onSort={() => handleSort("waktu")}
                    >
                      Waktu
                    </SortableTableHead>
                    <TableHead>Konter</TableHead>
                    <TableHead>Jenis Transaksi</TableHead>
                    <TableHead>Produk</TableHead>
                    <SortableTableHead
                      sortable
                      sorted={sortField === "nominal" ? sortDirection : null}
                      onSort={() => handleSort("nominal")}
                    >
                      Nominal
                    </SortableTableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tujuan</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((trx) => {
                    const tampilan = getTampilanTransaksi(
                      trx.produk.kategori,
                      trx.nomorTujuan,
                      trx.produk.nama,
                    );
                    return (
                      <TableRow
                        key={trx.id}
                        className={trx.perluReview ? "bg-yellow-50" : undefined}
                      >
                        <TableCell className="whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {formatWaktu(trx.waktu)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-text-primary">
                            {potongTeks(trx.konterNama, 20)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="default"
                              size="sm"
                              className={getCategoryBadgeColor(
                                trx.produk.kategori,
                              )}
                            >
                              {tampilan.labelJenisTransaksi}
                            </Badge>
                            {trx.perluReview && (
                              <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-[10px] font-semibold rounded">
                                PERLU REVIEW
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-text-primary">
                              {trx.produk.nama ||
                                (tampilan.tampilkanNamaProduk
                                  ? "-"
                                  : trx.produk.nama)}
                            </span>
                            {tampilan.tampilkanProviderSeluler &&
                              trx.providerSeluler && (
                                <span className="text-xs text-text-tertiary">
                                  {trx.providerSeluler}
                                </span>
                              )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <p className="text-sm font-medium text-text-primary">
                            {formatRupiah(trx.nominal)}
                          </p>
                        </TableCell>
                        <TableCell>
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
                            {STATUS_LABELS[trx.status]}
                          </Badge>
                          {trx.errorMessage && (
                            <p
                              className="text-xs text-text-tertiary mt-1 truncate max-w-37.5"
                              title={trx.errorMessage}
                            >
                              {trx.errorMessage}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {tampilan.tampilkanNomorTujuan && trx.nomorTujuan ? (
                            <span className="text-sm text-text-primary font-mono">
                              {trx.nomorTujuan}
                            </span>
                          ) : (
                            <span className="text-sm text-text-tertiary">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTransaction(trx)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Lihat Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                {/* Total Row */}
                <TableRow className="bg-gray-50 font-semibold">
                  <TableCell colSpan={4} className="text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      Total {transactions.length} Transaksi
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <p className="text-sm font-bold text-blue-600">
                      {formatRupiah(
                        transactions.reduce((sum, trx) => sum + trx.nominal, 0),
                      )}
                    </p>
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </Table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-border">
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
          <CardContent className="pt-6">
            <EmptyState
              icon={<Receipt className="h-6 w-6 text-text-tertiary" />}
              title="Tidak ada transaksi pending/gagal ditemukan"
              description={
                hasActiveFilters
                  ? "Coba ubah atau hapus filter untuk melihat transaksi"
                  : "Tidak ada transaksi dengan status pending atau gagal saat ini."
              }
              actionLabel={hasActiveFilters ? "Hapus Filter" : undefined}
              onAction={hasActiveFilters ? clearFilters : undefined}
            />
          </CardContent>
        )}
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
