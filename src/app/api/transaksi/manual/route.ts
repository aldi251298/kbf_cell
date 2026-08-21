import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { mapTransaksi } from "@/lib/mappers";
import type { TransaksiRow } from "@/types/database";
import type { TransaksiInputData } from "@/services/transaksiService";

/**
 * POST /api/transaksi/manual
 *
 * Lets the authenticated owner add a transaction manually from the dashboard
 * "Transaksi Baru" page. Unlike the Android ingest endpoint (which uses the
 * INGEST_API_KEY), this route authenticates via the owner's Supabase Auth
 * session and writes using the service-role client (bypassing RLS, since the
 * owner is allowed to insert).
 */
export async function POST(req: NextRequest) {
  // Parse & validate
  let body: TransaksiInputData;
  try {
    body = (await req.json()) as TransaksiInputData;
  } catch {
    return NextResponse.json(
      { error: "Body bukan JSON valid." },
      { status: 400 },
    );
  }

  const errors: string[] = [];
  if (!body.konterId) errors.push("konterId wajib diisi.");
  if (!body.produk?.nama) errors.push("produk.nama wajib diisi.");
  if (typeof body.nominal !== "number" || body.nominal < 0)
    errors.push("nominal harus angka >= 0.");
  if (!body.status || !["sukses", "gagal", "pending"].includes(body.status))
    errors.push("status tidak valid.");

  if (errors.length > 0) {
    return NextResponse.json(
      { error: "Validasi gagal.", details: errors },
      { status: 400 },
    );
  }

  // 3. Resolve device from konter
  const supabase = createServiceRoleClient();
  const { data: konter, error: konterErr } = await supabase
    .from("konter")
    .select("id, nama, perangkat_id")
    .eq("id", body.konterId)
    .single();

  if (konterErr || !konter) {
    return NextResponse.json(
      { error: "Konter tidak ditemukan." },
      { status: 404 },
    );
  }
  if (!konter.perangkat_id) {
    return NextResponse.json(
      { error: "Konter tidak terhubung ke perangkat." },
      { status: 400 },
    );
  }

  // 4. Build insert row (map old input format to new schema)
  const now = new Date().toISOString();
  const sn = `SN-${Date.now().toString(36).toUpperCase()}`;
  // Derive provider + jenis_transaksi from kategori
  const kategori = body.produk.kategori;
  const provider: "digipos" | "alpines" =
    kategori === "ewallet" ? "alpines" : "digipos";
  const jenisTransaksi: "pulsa" | "paket_data" | "ewallet_dana" =
    kategori === "pulsa"
      ? "pulsa"
      : kategori === "data"
        ? "paket_data"
        : kategori === "ewallet"
          ? "ewallet_dana"
          : "pulsa"; // fallback
  const idTransaksiProvider = `MANUAL-${Date.now().toString(36).toUpperCase()}`;
  const rawNotificationText = `[Manual Input] ${body.produk.nama} - ${body.nomorTujuan || "-"} - Rp${body.nominal}`;

  const insertRow = {
    waktu: now,
    device_id: konter.perangkat_id,
    konter_id: konter.id,
    konter_nama: body.konterNama || konter.nama,
    provider,
    id_transaksi_provider: idTransaksiProvider,
    jenis_transaksi: jenisTransaksi,
    nominal: body.nominal,
    nomor_tujuan: body.nomorTujuan || null,
    status: body.status,
    sn,
    nama_produk: body.produk.nama,
    raw_notification_text: rawNotificationText,
  };

  const { data, error } = await supabase
    .from("transaksi")
    .insert(insertRow)
    .select("*")
    .single();

  if (error) {
    console.error("[api/transaksi/manual] insert error:", error.message);
    return NextResponse.json(
      { error: "Gagal menyimpan transaksi.", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(mapTransaksi(data as unknown as TransaksiRow), {
    status: 201,
  });
}
