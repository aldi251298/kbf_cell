import { parseNotifikasiUniversal } from "../src/lib/parser";

const text = "Voucher Three 5.5 gb 3 hr   *888*Nomor Sn# VTR10.0895 akan diproses @13:23. Tunggu SMS notifikasi sebelum penggunaan";

async function test() {
  const result = await parseNotifikasiUniversal({ provider: "alpines", rawText: text });
  console.log("filtered:", result.filtered);
  console.log("filterReason:", result.filterReason);
  if (result.parsed) {
    console.log("jenis_transaksi:", result.parsed.jenis_transaksi);
    console.log("nominal:", result.parsed.nominal);
    console.log("status:", result.parsed.status);
    console.log("perlu_review:", result.parsed.perlu_review);
    console.log("detail_tambahan:", JSON.stringify(result.parsed.detail_tambahan, null, 2));
  }
}

test();