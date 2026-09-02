"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { formatWaktu } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PengisianSaldoRow {
  id: string;
  konter_id: string;
  raw_notification_text: string;
  nominal_penambahan: number | null;
  saldo_sebelum: number | null;
  saldo_sesudah: number | null;
  waktu_capture: string;
  created_at: string;
}

export default function HalamanRiwayatSaldoAlpines() {
  const [riwayat, setRiwayat] = useState<PengisianSaldoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [konterId, setKonterId] = useState<string>("semua");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const supabase = createClientComponentClient();

  const fetchRiwayat = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("pengisian_saldo_alpines")
        .select("*", { count: "exact" })
        .order("waktu_capture", { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (konterId !== "semua") {
        query = query.eq("konter_id", konterId);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setRiwayat((data ?? []) as PengisianSaldoRow[]);
      setTotalPages(Math.ceil((count ?? 0) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error("Gagal mengambil riwayat pengisian saldo:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiwayat();
  }, [page, konterId]);

  // Fetch konter list for filter dropdown
  const [konterList, setKonterList] = useState<{ id: string; nama: string }[]>(
    [],
  );

  useEffect(() => {
    supabase
      .from("konter")
      .select("id, nama")
      .order("id")
      .then(({ data }) => {
        if (data) setKonterList(data as { id: string; nama: string }[]);
      });
  }, [supabase]);

  // Create a Map from konter_id to konter_nama for display in table
  const konterMap = useMemo(() => {
    const map = new Map<string, string>();
    konterList.forEach((k) => map.set(k.id, k.nama));
    return map;
  }, [konterList]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            Riwayat Pengisian Saldo Alpines
          </h1>
          <p className="text-sm text-gray-500">
            Histori penambahan saldo dari notifikasi WhatsApp Business
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={konterId}
            onChange={(e) => setKonterId(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="semua">Semua Konter</option>
            {konterList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama} ({k.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-gray-500">Memuat riwayat...</p>
          </div>
        ) : riwayat.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">Belum ada riwayat pengisian saldo</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                    <th className="px-6 py-3">Waktu</th>
                    <th className="px-6 py-3 text-right">
                      Nominal Ditambahkan
                    </th>
                    <th className="px-6 py-3 text-right">Saldo Sebelum</th>
                    <th className="px-6 py-3 text-right">Saldo Sesudah</th>
                    <th className="px-6 py-3 text-right">Konter</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayat.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-gray-50 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatWaktu(row.waktu_capture)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-emerald-600 text-right">
                        +Rp{row.nominal_penambahan?.toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-right">
                        Rp{row.saldo_sebelum?.toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                        Rp{row.saldo_sesudah?.toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 text-right">
                        {konterMap.get(row.konter_id) ?? row.konter_id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Halaman {page} dari {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft size={16} />
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
