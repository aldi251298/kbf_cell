import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * GET /api/kategori-dinamis
 *
 * Returns all dynamic transaction categories from the database.
 * Used by frontend to populate filter dropdowns dynamically.
 */
export async function GET() {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("kategori_transaksi_dinamis")
    .select(
      "kode, label_tampilan, contoh_header, dikonfirmasi_manual, jumlah_kemunculan",
    )
    .order("jumlah_kemunculan", { ascending: false });

  if (error) {
    console.error("[api/kategori-dinamis] query error:", error.message);
    return NextResponse.json(
      { error: "Gagal mengambil kategori dinamis." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: data ?? [],
  });
}
