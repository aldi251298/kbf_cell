import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { parseNotifikasiUniversal } from "@/lib/parser";
import type { IngestTransaksiPayload } from "@/types/database";

/**
 * POST /api/ingest/transaksi
 *
 * Fase 2.3.1: Complete ingestion flow with:
 * - Saldo aplikasi separation (both providers)
 * - Non-transaction filter (promo, info, top-up saldo sendiri)
 * - Universal parsing with dynamic category detection
 * - Data TIDAK PERNAH ditolak — minimal tersimpan dengan perlu_review=true
 *
 * Fase 2.3.3: Alpines pending notifications are ignored at ingestion (Bug 2 fix)
 * - Detect "akan diproses", "tunggu sms notifikasi", "mohon tunggu sebentar" for Alpines
 * - Archive to notifikasi_diabaikan, never insert to transaksi
 * - Deduplication removed (pending→success flow no longer needed)
 */

// Keyword untuk deteksi notifikasi pending Alpines
const keywordAlpinesPending =
  /\b(akan\s*diproses|tunggu\s*sms\s*notifikasi|mohon\s*tunggu\s*sebentar)\b/i;

function apakahNotifikasiPendingAlpines(
  rawText: string,
  provider: string,
): boolean {
  return provider === "alpines" && keywordAlpinesPending.test(rawText);
}

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

  const supabase = createServiceRoleClient();
  const konterId = body.konter_id.trim();
  const waktuCapture = body.waktu_capture;
  const provider = body.provider;
  const rawNotificationText = body.raw_notification_text;

  // 3. DETEKSI AWAL: Alpines notifikasi pending — skip total, jangan insert ke transaksi
  // Letakkan PALING AWAL, SEBELUM pisahkanSaldoAplikasi() dan SEBELUM apakahTransaksiPelanggan()
  if (apakahNotifikasiPendingAlpines(rawNotificationText, provider)) {
    // Cukup arsipkan untuk jejak, TIDAK PERNAH masuk tabel transaksi
    await supabase.from("notifikasi_diabaikan").insert({
      provider,
      konter_id: konterId,
      raw_notification_text: rawNotificationText,
      alasan: "alpines_notifikasi_pending_diabaikan",
      waktu_capture: waktuCapture,
    });

    return NextResponse.json({
      success: true,
      data: { diabaikan: true, alasan: "notifikasi_pending_diabaikan" },
    });
  }

  // 4. Universal parsing with full Fase 2.3.1 flow
  let parseResult;
  try {
    parseResult = await parseNotifikasiUniversal({
      provider,
      rawText: rawNotificationText,
    });
  } catch (e) {
    console.error("[ingest] parser error:", e);
    // Fallback: treat as unknown transaction
    parseResult = {
      parsed: {
        provider,
        id_transaksi_provider: `error-${Date.now()}`,
        jenis_transaksi: "belum_dikenal",
        nominal: null,
        nomor_tujuan: null,
        nama_produk: null,
        provider_seluler: null,
        nama_pemilik: null,
        status: "pending" as const,
        raw_notification_text: rawNotificationText,
        detail_tambahan: { parser_error: (e as Error).message },
        perlu_review: true,
      },
      filtered: false,
      saldoInfo: null,
    };
  }

  // 5. Handle filtered notifications (non-transaction)
  if (parseResult.filtered) {
    // Simpan ke notifikasi_diabaikan
    await supabase.from("notifikasi_diabaikan").insert({
      provider,
      konter_id: konterId,
      raw_notification_text: rawNotificationText,
      alasan: parseResult.filterReason,
      waktu_capture: waktuCapture,
    });

    return NextResponse.json({
      success: true,
      data: { diabaikan: true, alasan: parseResult.filterReason },
    });
  }

  const parsed = parseResult.parsed!;

  // 6. Tambah biaya admin Rp 2.000 untuk pulsa & paket data
  const BIAYA_ADMIN = 2000;
  const jenisTransaksi = parsed.jenis_transaksi.toLowerCase();
  const nominalFinal =
    jenisTransaksi === "pulsa" || jenisTransaksi === "paket_data"
      ? (parsed.nominal ?? 0) + BIAYA_ADMIN
      : parsed.nominal;

  // 7. Prepare base insert row
  const baseInsertRow = {
    waktu: waktuCapture,
    device_id: null,
    konter_id: konterId,
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
    raw_notification_text: parsed.raw_notification_text, // SELALU rawText ASLI UTUH
    detail_tambahan: {
      ...parsed.detail_tambahan,
      nominal_asli: parsed.nominal,
      biaya_admin:
        jenisTransaksi === "pulsa" || jenisTransaksi === "paket_data"
          ? BIAYA_ADMIN
          : 0,
    },
    perlu_review: parsed.perlu_review,
  };

  // 8. INSERT baris baru (deduplication removed in Fase 2.3.3 - Alpines pending notifications
  // are now filtered at ingestion, so pending->success dedup is no longer needed.
  // Other duplicate cases are rare and can be handled manually if needed.)
  const { data, error: insertErr } = await supabase
    .from("transaksi")
    .insert(baseInsertRow)
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
    `[ingest] transaksi tersimpan: id=${data.id} provider=${provider} jenis=${parsed.jenis_transaksi} nominal=${parsed.nominal} review=${parsed.perlu_review}`,
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
