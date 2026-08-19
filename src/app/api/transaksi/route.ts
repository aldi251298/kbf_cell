import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { mapTransaksi } from "@/lib/mappers";
import type { TransaksiRow } from "@/types/database";

/**
 * GET /api/transaksi
 *
 * Dashboard read endpoint for transactions. Authenticated via Supabase Auth
 * session (RLS enforces read access). Supports the same filter/sort/pagination
 * parameters used by the frontend service layer.
 *
 * Query params:
 *   page, limit, startDate, endDate, konterId, status, search,
 *   sortBy (waktu|nominal), sortOrder (asc|desc)
 */
export async function GET(req: NextRequest) {
  const supabase = createServiceRoleClient();
  const url = req.nextUrl;
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(
    200,
    Math.max(1, Number(url.searchParams.get("limit") ?? "20")),
  );
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const konterId = url.searchParams.get("konterId");
  const status = url.searchParams.get("status");
  const jenisTransaksi = url.searchParams.get("jenisTransaksi");
  const search = url.searchParams.get("search");
  const sortBy = url.searchParams.get("sortBy") ?? "waktu";
  const sortOrder = url.searchParams.get("sortOrder") ?? "desc";

  // Fetch konter list for name resolution (manual LEFT JOIN equivalent)
  let konterMap = new Map<string, string>();
  try {
    const { data: konterRows } = await supabase
      .from("konter")
      .select("id, nama")
      .order("id");
    konterMap = new Map(
      (konterRows ?? []).map((k) => [k.id, k.nama] as [string, string]),
    );
  } catch {
    // If konter fetch fails, continue with empty map (names will fallback to "Tidak diketahui")
  }

  let query = supabase.from("transaksi").select("*", { count: "exact" });

  if (startDate) query = query.gte("waktu", startDate);
  if (endDate) query = query.lte("waktu", endDate);
  if (konterId) query = query.eq("konter_id", konterId);
  if (status) query = query.eq("status", status);
  if (jenisTransaksi) query = query.eq("jenis_transaksi", jenisTransaksi);
  if (search) {
    query = query.or(
      `nomor_tujuan.ilike.%${search}%,produk_nama.ilike.%${search}%,konter_nama.ilike.%${search}%`,
    );
  }

  // Sorting
  const sortColumn = sortBy === "nominal" ? "nominal" : "waktu";
  query = query.order(sortColumn, {
    ascending: sortOrder === "asc",
  });

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("[api/transaksi] query error:", error.message);
    return NextResponse.json(
      { error: "Gagal mengambil data transaksi." },
      { status: 500 },
    );
  }

  const rows = (data ?? []).map((row) => {
    const r = row as unknown as TransaksiRow;
    return {
      ...r,
      konter_nama:
        konterMap.get(r.konter_id ?? "") ?? r.konter_nama ?? "Tidak diketahui",
    };
  }) as unknown as TransaksiRow[];
  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return NextResponse.json({
    data: rows.map(mapTransaksi),
    total,
    page,
    totalPages,
  });
}
