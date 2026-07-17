"use client";

import { useState, useEffect } from "react";
import {
  getTransaksiPaginated,
  exportTransaksiCSV,
} from "@/services/transaksiService";
import type { Transaksi, StatusTransaksi } from "@/types";
import { formatRupiah, formatWaktu, potongTeks } from "@/lib/utils";
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
import { Search, X, Download, Receipt, Filter, Eye } from "lucide-react";
import { STATUS_LABELS } from "@/constants/statusTransaksi";
import { getKonterList } from "@/services";
import type { Konter } from "@/types";

// Constants
const ITEMS_PER_PAGE = 20;

type SortField = "waktu" | "nominal";
type SortDirection = "asc" | "desc";

// Transaction Detail Modal Component
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
        return "bg-blue-50 text-blue-700";
      case "data":
        return "bg-purple-50 text-purple-700";
      case "voucher":
        return "bg-amber-50 text-amber-700";
      case "p2p":
        return "bg-green-50 text-green-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Detail Transaksi</h3>
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
              variant={getStatusBadgeVariant(transaction.status) as "success" | "warning" | "error" | "default"}
              size="sm"
            >
              {STATUS_LABELS[transaction.status]}
            </Badge>
          </div>

          {/* Waktu */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Waktu Transaksi</span>
            <span className="text-sm font-medium text-gray-900">{formatWaktu(transaction.waktu)}</span>
          </div>

          {/* Konter */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Konter</span>
            <span className="text-sm font-medium text-gray-900">{transaction.konterNama}</span>
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
              <span className="text-sm font-medium text-gray-900">{transaction.produk.nama}</span>
            </div>
          </div>

          {/* Nominal */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Nominal</span>
            <span className="text-sm font-bold text-gray-900">{formatRupiah(transaction.nominal)}</span>
          </div>

          {/* Nomor Tujuan - Only show if exists and not empty */}
          {transaction.nomorTujuan && transaction.nomorTujuan !== "-" && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Nomor Tujuan</span>
              <span className="text-sm font-mono font-medium text-gray-900">{transaction.nomorTujuan}</span>
            </div>
          )}

          {/* Serial Number */}
          {transaction.sn && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Serial Number</span>
              <span className="text-sm font-mono text-gray-900">{transaction.sn}</span>
            </div>
          )}

          {/* Error Message */}
          {transaction.errorMessage && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-xs font-medium text-red-600 mb-1">Pesan Error</p>
              <p className="text-sm text-red-700">{transaction.errorMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TransaksiPage() {
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKonter, setSelectedKonter] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
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

  // Detail modal state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaksi | null>(null);

  // Fetch konter list
  useEffect(() => {
    getKonterList().then(setKonterList);
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Resetting page on filter change is a valid pattern
    setCurrentPage(1);
  }, [dateFrom, dateTo, selectedKonter, selectedStatus, searchTerm]);

  // Fetch transactions with proper dependencies
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial loading state before fetch is a valid pattern
    setLoading(true);
    const fetchTransactions = async () => {
      try {
        const filters = {
          ...(dateFrom && { startDate: new Date(dateFrom) }),
          ...(dateTo && { endDate: new Date(dateTo) }),
          ...(selectedKonter && { konterId: selectedKonter }),
          ...(selectedStatus && { status: selectedStatus as StatusTransaksi }),
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
      const filters = {
        ...(dateFrom && { startDate: new Date(dateFrom) }),
        ...(dateTo && { endDate: new Date(dateTo) }),
        ...(selectedKonter && { konterId: selectedKonter }),
        ...(selectedStatus && { status: selectedStatus as StatusTransaksi }),
        ...(searchTerm && { search: searchTerm }),
      };

      const csvContent = await exportTransaksiCSV(filters);

      // Create download link with BOM for Excel compatibility
      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `transaksi-konter-pulsa-${new Date().toISOString().split("T")[0]}.csv`;
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

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedKonter("");
    setSelectedStatus("");
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
          Export CSV
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
            dari <span className="font-medium text-text-secondary">{totalItems}</span> transaksi
          </p>

          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-text-tertiary" />
              <span className="text-sm text-text-tertiary">
                Filter aktif
              </span>
            </div>
          )}
        </div>
      )}

      {/* Transaction Table */}
      <Card>
        {loading ? (
          <CardContent className="pt-6">
            <TableSkeleton rows={5} columns={5} />
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
                    <TableHead>Produk</TableHead>
                    <SortableTableHead
                      sortable
                      sorted={sortField === "nominal" ? sortDirection : null}
                      onSort={() => handleSort("nominal")}
                    >
                      Nominal
                    </SortableTableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((trx) => (
                    <TableRow key={trx.id}>
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
                        <div>
                          <p className="text-sm text-text-primary">
                            {trx.produk.nama}
                          </p>
                          <p className="text-xs text-text-tertiary capitalize">
                            {trx.produk.kategori}
                          </p>
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
                            className="text-xs text-text-tertiary mt-1 truncate max-w-[150px]"
                            title={trx.errorMessage}
                          >
                            {trx.errorMessage}
                          </p>
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
                  ))}
                </TableBody>
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
              title="Tidak ada transaksi ditemukan"
              description={
                hasActiveFilters
                  ? "Coba ubah atau hapus filter untuk melihat transaksi"
                  : "Belum ada transaksi. Transaksi akan muncul saat ada aktivitas konter."
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
