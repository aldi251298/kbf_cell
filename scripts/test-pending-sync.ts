import { parseNotifikasi } from "../src/lib/parser";

const text =
  "Voucher Three 5.5 gb 3 hr   *888*Nomor Sn# VTR10.0895 akan diproses @13:23. Tunggu SMS notifikasi sebelum penggunaan";

const result = parseNotifikasi({ provider: "alpines", rawText: text });
console.log("jenis_transaksi:", result.jenis_transaksi);
console.log("nominal:", result.nominal);
console.log("status:", result.status);
console.log("perlu_review:", result.perlu_review);
console.log(
  "detail_tambahan:",
  JSON.stringify(result.detail_tambahan, null, 2),
);
