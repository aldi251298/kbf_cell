import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { parseNotifikasiUniversal } from "@/lib/parser";
import {
  pisahkanSaldoAplikasi,
  apakahTransaksiPelanggan,
  apakahNotifikasiPendingAlpines,
} from "@/lib/parser/universal";
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
 *
 * Fase 2.3.4: Alpines duplicate handling via unique constraint (idx_transaksi_dedup_alpines)
 * - Unique index on (konter_id, raw_notification_text) WHERE provider = 'alpines'
 * - Database rejects duplicates atomically (no race condition)
 * - Application handles 23505 error gracefully, archives to notifikasi_diabaikan
 * - Digipos excluded (no double-send issue, no constraint)
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

  const supabase = createServiceRoleClient();
  const konterId = body.konter_id.trim();
  const waktuCapture = body.waktu_capture;
  const provider = body.provider;
  const rawNotificationText = body.raw_notification_text;

  // 3. CEK 1: Khusus Alpines pending — kalau true, STOP total, jangan proses apa pun lagi
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
      data: { diabaikan: true, alasan: "pending_alpines" },
    });
  }

  // 4. CEK 2: promo/info/top-up saldo sendiri — berlaku untuk KEDUA provider, independen dari cek 1 di atas
  const { teksTanpaSaldo } = pisahkanSaldoAplikasi(rawNotificationText);
  const klasifikasi = apakahTransaksiPelanggan(teksTanpaSaldo);
  if (!klasifikasi.valid) {
    await supabase.from("notifikasi_diabaikan").insert({
      provider,
      konter_id: konterId,
      raw_notification_text: rawNotificationText,
      alasan: klasifikasi.alasan,
      waktu_capture: waktuCapture,
    });

    return NextResponse.json({
      success: true,
      data: { diabaikan: true, alasan: klasifikasi.alasan },
    });
  }

  // 5. Kalau lolos KEDUA cek di atas, baru lanjut ke parser jenis transaksi seperti biasa...
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

  // 6. Handle filtered notifications (non-transaction) - should not happen since we already filtered above
  // but keep as safety net
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

  // 7. Tambah biaya admin Rp 2.000 untuk pulsa & paket data
  const BIAYA_ADMIN = 2000;
  const jenisTransaksi = parsed.jenis_transaksi.toLowerCase();
  const nominalFinal =
    jenisTransaksi === "pulsa" || jenisTransaksi === "paket_data"
      ? (parsed.nominal ?? 0) + BIAYA_ADMIN
      : parsed.nominal;

  // 8. Prepare base insert row
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

  // 9. INSERT baris baru
  // Unique constraint idx_transaksi_dedup_alpines (konter_id + raw_notification_text WHERE provider='alpines')
  // will automatically reject duplicates at database level — handle 23505 gracefully.
  const { data, error: insertErr } = await supabase
    .from("transaksi")
    .insert(baseInsertRow)
    .select("id");

  if (insertErr) {
    // 23505 = unique_violation (PostgreSQL error code)
    if (insertErr.code === "23505") {
      // Ini BUKAN error sungguhan — database menolak karena memang duplikat,
      // sesuai desain constraint yang baru dipasang. Catat sebagai jejak, bukan error.
      await supabase.from("notifikasi_diabaikan").insert({
        provider,
        konter_id: konterId,
        raw_notification_text: rawNotificationText,
        alasan: "duplikat_ditolak_unique_constraint",
        waktu_capture: waktuCapture,
      });

      return NextResponse.json({
        success: true,
        data: { diabaikan: true, alasan: "duplikat_terdeteksi" },
      });
    }

    // Error lain di luar duplikat — ini baru perlu dilaporkan sebagai kegagalan sungguhan
    console.error("[ingest] gagal insert:", insertErr.message);
    return NextResponse.json(
      { error: "Gagal menyimpan transaksi.", detail: insertErr.message },
      { status: 500 },
    );
  }

  console.log(
    `[ingest] transaksi tersimpan: id=${data[0].id} provider=${provider} jenis=${parsed.jenis_transaksi} nominal=${parsed.nominal} review=${parsed.perlu_review}`,
  );

  return NextResponse.json(
    {
      success: true,
      data: {
        id: data[0].id,
        jenis_transaksi: parsed.jenis_transaksi,
        nominal: parsed.nominal,
        status: parsed.status,
        perlu_review: parsed.perlu_review,
      },
    },
    { status: 201 },
  );
}
