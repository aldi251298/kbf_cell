import { parseNotifikasi } from "../src/lib/parser";

const text1 = "Voucher Three 5.5 gb 3 hr   *888*Nomor Sn# VTR10.0895 akan diproses @13:23. Tunggu SMS notifikasi sebelum penggunaan";
const text2 = "Voucher Three 5.5 gb 3 hr *888*Nomor Sn# VTR10.0895 Berhasil. SN/Ref: :4066 3084 4883 9905. Saldo 52.927 - 13150 = 39.777 @21/08 13:23:20";

console.log("=== Test 1: Pending notification ===");
const result1 = parseNotifikasi({ provider: "alpines", rawText: text1 });
console.log("jenis_transaksi:", result1.jenis_transaksi);
console.log("nominal:", result1.nominal);
console.log("status:", result1.status);
console.log("perlu_review:", result1.perlu_review);
console.log("detail_tambahan:", JSON.stringify(result1.detail_tambahan, null, 2));

console.log("\n=== Test 2: Success notification ===");
const result2 = parseNotifikasi({ provider: "alpines", rawText: text2 });
console.log("jenis_transaksi:", result2.jenis_transaksi);
console.log("nominal:", result2.nominal);
console.log("status:", result2.status);
console.log("perlu_review:", result2.perlu_review);
console.log("detail_tambahan:", JSON.stringify(result2.detail_tambahan, null, 2));