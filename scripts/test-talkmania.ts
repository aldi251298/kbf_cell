import { parseNotifikasi } from "../src/lib/parser";

const text =
  "Isi ulang paket Talkmania Sakti Bulanan 6281374087911 pd 21/08/2026 16:04:39 berhasil. Voucher senilai Rp7999. Nomor seri 04250600000200678066. Cek sisa stock di *181*1*5*2*PIN#.";
const result = parseNotifikasi({ provider: "alpines", rawText: text });
console.log("jenis_transaksi:", result.jenis_transaksi);
console.log("nominal:", result.nominal);
console.log("nomor_tujuan:", result.nomor_tujuan);
console.log("status:", result.status);
console.log("perlu_review:", result.perlu_review);
