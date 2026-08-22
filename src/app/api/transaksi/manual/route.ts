import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Map form jenis_transaksi to valid database enum values.
 * Database CHECK constraint allows: pulsa, paket_data, pln, ewallet_dana, voucher, pulsa_op
 */
function mapJenisTransaksi(formJenis: string): string {
  const map: Record<string, string> = {
    pulsa: "pulsa",
    paket_data: "paket_data",
    paket_nelpon: "paket_data", // map to closest valid enum
    pln: "pln",
    ewallet: "ewallet_dana", // map to valid enum
    voucher_fisik: "voucher", // map to voucher
  };
  return map[formJenis] ?? "pulsa"; // fallback to pulsa
}

/**
 * Map form jenis_transaksi to valid provider enum.
 * Database CHECK constraint allows: digipos, alpines
 */
function mapProvider(formJenis: string): "digipos" | "alpines" {
  // ewallet uses alpines provider, others use digipos
  return formJenis === "ewallet" ? "alpines" : "digipos";
}

export async function POST(request: Request) {
  const supabase = createServiceRoleClient();
  const body = await request.json();
  const {
    jenis_transaksi,
    konter_id,
    nominal,
    nomor_tujuan,
    nama_produk,
    nama_pemilik,
    tipe_pln,
    provider_seluler,
  } = body;

  // Validasi minimal — hanya field generik wajib, konsisten dengan prinsip validasi longgar di ingest
  if (!jenis_transaksi || !konter_id) {
    return NextResponse.json(
      { success: false, error: "jenis_transaksi dan konter_id wajib diisi" },
      { status: 400 },
    );
  }

  // Ambil nama konter untuk kolom konter_nama (not null)
  const { data: konter, error: konterError } = await supabase
    .from("konter")
    .select("nama")
    .eq("id", konter_id)
    .single();

  if (konterError || !konter) {
    return NextResponse.json(
      { success: false, error: "Konter tidak ditemukan" },
      { status: 404 },
    );
  }

  const dbJenisTransaksi = mapJenisTransaksi(jenis_transaksi);
  const dbProvider = mapProvider(jenis_transaksi);

  const idTransaksiProvider = `MANUAL-${Date.now().toString(36).toUpperCase()}`;

  const payload = {
    konter_nama: konter.nama,
    provider: dbProvider,
    konter_id,
    id_transaksi_provider: idTransaksiProvider,
    jenis_transaksi: dbJenisTransaksi,
    nominal: nominal != null ? Number(nominal) : null,
    nomor_tujuan: nomor_tujuan ?? null,
    nama_produk: nama_produk ?? null,
    nama_pemilik: nama_pemilik ?? null,
    provider_seluler: provider_seluler ?? null,
    status: "sukses",
    waktu: new Date().toISOString(),
    raw_notification_text: "(input manual oleh kasir)",
    detail_tambahan: tipe_pln
      ? { tipe_pln, jenis_transaksi_asli: jenis_transaksi }
      : { jenis_transaksi_asli: jenis_transaksi },
    perlu_review: false,
  };

  const { error } = await supabase.from("transaksi").insert(payload);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
