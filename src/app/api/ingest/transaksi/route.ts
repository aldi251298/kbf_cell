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
 * - Deduplication based on SN/REFF/ID Transaksi within 15-minute window
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

  const supabase = createServiceRoleClient();
  const konterId = body.konter_id.trim();
  const waktuCapture = body.waktu_capture;
  const provider = body.provider;
  const rawNotificationText = body.raw_notification_text;

  // 3. Universal parsing with full Fase 2.3.1 flow
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

  // 4. Handle filtered notifications (non-transaction)
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

  // 5. Tambah biaya admin Rp 2.000 untuk pulsa & paket data
  const BIAYA_ADMIN = 2000;
  const jenisTransaksi = parsed.jenis_transaksi.toLowerCase();
  const nominalFinal =
    jenisTransaksi === "pulsa" || jenisTransaksi === "paket_data"
      ? (parsed.nominal ?? 0) + BIAYA_ADMIN
      : parsed.nominal;

  // 6. Prepare base insert row
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

  // 7. DEDUPLICATION: Cek transaksi duplikat berdasarkan SN/REFF/ID Transaksi dalam 15 menit
  // Ekstrak identifier dari detail_tambahan
  const detailTambahan = parsed.detail_tambahan as Record<
    string,
    unknown
  > | null;
  const identifier =
    (detailTambahan?.reff as string) ??
    (detailTambahan?.sn as string) ??
    (detailTambahan?.id_transaksi as string) ??
    null;

  if (identifier) {
    const limaBelasMenitLalu = new Date(
      Date.now() - 15 * 60 * 1000,
    ).toISOString();

    const { data: existing } = await supabase
      .from("transaksi")
      .select("*")
      .eq("konter_id", konterId)
      .gte("waktu_transaksi", limaBelasMenitLalu)
      .or(
        `detail_tambahan->>reff.eq.${identifier},detail_tambahan->>sn.eq.${identifier},detail_tambahan->>id_transaksi.eq.${identifier}`,
      )
      .limit(1)
      .maybeSingle();

    if (existing) {
      // DUPLIKAT DITEMUKAN - UPDATE baris yang sudah ada

      // Gabungkan raw_text_history
      const existingHistory = (existing.detail_tambahan
        ?.raw_text_history as string[]) ?? [existing.raw_notification_text];
      const newHistory = [...existingHistory, rawNotificationText];

      // Update: timpa status, nominal, nomor_tujuan, raw_notification_text, detail_tambahan
      // Pertahankan nilai lama kalau yang baru kosong/null
      const updateRow = {
        status: parsed.status,
        nominal: parsed.nominal ?? existing.nominal,
        nomor_tujuan: parsed.nomor_tujuan ?? existing.nomor_tujuan,
        raw_notification_text: rawNotificationText, // pakai versi terbaru
        detail_tambahan: {
          ...existing.detail_tambahan,
          ...parsed.detail_tambahan,
          raw_text_history: newHistory,
          nominal_asli:
            parsed.nominal ?? existing.detail_tambahan?.nominal_asli,
        },
        perlu_review: parsed.perlu_review,
        updated_at: new Date().toISOString(),
      };

      const { error: updateErr } = await supabase
        .from("transaksi")
        .update(updateRow)
        .eq("id", existing.id);

      if (updateErr) {
        console.error("[ingest] gagal update duplikat:", updateErr.message);
        return NextResponse.json(
          {
            error: "Gagal update transaksi duplikat.",
            detail: updateErr.message,
          },
          { status: 500 },
        );
      }

      console.log(
        `[ingest] transaksi duplikat di-update: id=${existing.id} provider=${provider} jenis=${parsed.jenis_transaksi} identifier=${identifier}`,
      );

      return NextResponse.json({
        success: true,
        data: {
          id: existing.id,
          jenis_transaksi: parsed.jenis_transaksi,
          nominal: parsed.nominal,
          status: parsed.status,
          perlu_review: parsed.perlu_review,
          duplicated: true,
        },
      });
    }
  }

  // 8. TIDAK ADA DUPLIKAT - INSERT baris baru
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
