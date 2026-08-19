import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { parseNotifikasi } from "@/lib/parser";
import type { IngestTransaksiPayload } from "@/types/database";

/**
 * POST /api/ingest/transaksi
 *
 * Fase 2.2: Menerima raw notification text + metadata minimal.
 * - Tidak ada validasi device_id
 * - Tidak ada API key
 * - Seluruh parsing dilakukan di backend
 * - Data TIDAK PERNAH ditolak — minimal tersimpan dengan perlu_review=true
 */
export async function POST(req: NextRequest) {
  // 1. Parse & validate body (minimal)
  let body: IngestTransaksiPayload;
  try {
    body = (await req.json()) as IngestTransaksiPayload;
  } catch {
    return NextResponse.json(
      { error: "Body bukan JSON yang valid." },
      { status: 400 },
    );
  }

  // 2. Validasi minimal (hanya ini, tidak lebih)
  const errors: string[] = [];

  if (!body.provider || !["digipos", "alpines"].includes(body.provider)) {
    errors.push("provider harus 'digipos' atau 'alpines'.");
  }
  if (
    !body.konter_id ||
    typeof body.konter_id !== "string" ||
    body.konter_id.trim() === ""
  ) {
    errors.push("konter_id wajib diisi dan tidak boleh kosong.");
  }
  if (
    !body.raw_notification_text ||
    typeof body.raw_notification_text !== "string" ||
    body.raw_notification_text.trim() === ""
  ) {
    errors.push("raw_notification_text wajib diisi dan tidak boleh kosong.");
  }
  if (!body.waktu_capture || isNaN(new Date(body.waktu_capture).getTime())) {
    errors.push(
      "waktu_capture wajib diisi dan harus timestamp ISO-8601 valid.",
    );
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { error: "Validasi gagal.", details: errors },
      { status: 400 },
    );
  }

  // 3. Parse raw text → structured data
  let parsed;
  try {
    parsed = parseNotifikasi({
      provider: body.provider,
      rawText: body.raw_notification_text,
    });
  } catch (e) {
    // PENDING_SKIP — transaksi pending tidak disimpan
    if (e instanceof Error && e.message === "PENDING_SKIP") {
      return NextResponse.json(
        {
          success: true,
          skipped: true,
          reason: "Transaksi pending — tidak disimpan.",
        },
        { status: 200 },
      );
    }
    console.error("[ingest] parser error:", e);
    // Fallback: simpan sebagai belum_dikenal
    parsed = {
      provider: body.provider,
      id_transaksi_provider: `error-${Date.now()}`,
      jenis_transaksi: "belum_dikenal",
      nominal: null,
      nomor_tujuan: null,
      nama_produk: null,
      provider_seluler: null,
      nama_pemilik: null,
      status: "pending" as const,
      raw_notification_text: body.raw_notification_text,
      detail_tambahan: { parser_error: (e as Error).message },
      perlu_review: true,
    };
  }

  // 4. Tambah biaya admin Rp 2.000 untuk pulsa & paket data
  const BIAYA_ADMIN = 2000;
  const jenisTransaksi = parsed.jenis_transaksi.toLowerCase();
  const nominalFinal =
    jenisTransaksi === "pulsa" || jenisTransaksi === "paket_data"
      ? (parsed.nominal ?? 0) + BIAYA_ADMIN
      : parsed.nominal;

  // 5. Simpan ke tabel transaksi
  const supabase = createServiceRoleClient();
  const insertRow = {
    waktu: body.waktu_capture,
    device_id: null,
    konter_id: body.konter_id.trim(),
    konter_nama: "Unknown",
    provider: parsed.provider,
    id_transaksi_provider: parsed.id_transaksi_provider,
    jenis_transaksi: parsed.jenis_transaksi,
    nama_produk: parsed.nama_produk,
    provider_seluler: parsed.provider_seluler,
    nama_pemilik: parsed.nama_pemilik,
    nominal: nominalFinal,
    nomor_tujuan: parsed.nomor_tujuan,
    status: parsed.status,
    raw_notification_text: parsed.raw_notification_text,
    detail_tambahan: {
      ...parsed.detail_tambahan,
      nominal_asli: parsed.nominal,
      biaya_admin: jenisTransaksi === "pulsa" || jenisTransaksi === "paket_data" ? BIAYA_ADMIN : 0,
    },
    perlu_review: parsed.perlu_review,
  };

  const { data, error: insertErr } = await supabase
    .from("transaksi")
    .insert(insertRow)
    .select("id")
    .single();

  if (insertErr) {
    console.error("[ingest] gagal insert:", insertErr.message);
    return NextResponse.json(
      { error: "Gagal menyimpan transaksi.", detail: insertErr.message },
      { status: 500 },
    );
  }

  console.log(
    `[ingest] transaksi tersimpan: id=${data.id} provider=${parsed.provider} jenis=${parsed.jenis_transaksi} nominal=${parsed.nominal} review=${parsed.perlu_review}`,
  );

  return NextResponse.json(
    {
      success: true,
      data: {
        id: data.id,
        jenis_transaksi: parsed.jenis_transaksi,
        nominal: parsed.nominal,
        status: parsed.status,
        perlu_review: parsed.perlu_review,
      },
    },
    { status: 201 },
  );
}
