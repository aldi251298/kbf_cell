import { parseStrukturAlpines, extractNominalAlpines } from "@/lib/parser/universal";
import { extractNominalForAlpines } from "@/lib/parser/extractNominal";

describe("Alpines Voucher Parser - User Issue", () => {
  it("should extract nominal from saldo diff for voucher format with dot thousand separator", () => {
    // User's example: "VOUCHER AIGO 5.5 gb 3 hari    *838*nomor voucher# VA5.0838 Berhasil. SN/Ref:  :5213 9971 1934 0958. Saldo 20.327 - 11950 = 8.377 @22/08 20:24:03"
    // Expected nominal: 11950 (from Saldo 20.327 - 11950 = 8.377)
    const testText = "VOUCHER AIGO 5.5 gb 3 hari    *838*nomor voucher# VA5.0838 Berhasil. SN/Ref:  :5213 9971 1934 0958. Saldo 20.327 - 11950 = 8.377 @22/08 20:24:03";

    const structure = parseStrukturAlpines(testText);
    console.log("Structure:", JSON.stringify(structure, null, 2));

    const result = extractNominalAlpines(
      testText,
      structure.headerSegment,
      structure.snRefSegment,
      structure.saldoMatch
    );
    console.log("extractNominalAlpines result:", result);

    const result2 = extractNominalForAlpines(testText);
    console.log("extractNominalForAlpines result:", result2);

    // The nominal should be 11950 (from the saldo diff)
    expect(result.nominal).toBe(11950);
    expect(result.dariSaldoFallback).toBe(true);
    expect(result2.nominal).toBe(11950);
    expect(result2.dariSaldoFallback).toBe(true);
  });

  it("should handle saldo with dot thousand separator in potongan (11.950)", () => {
    // Test case where potongan has dot as thousand separator
    const testText = "VOUCHER AIGO 5.5 gb 3 hari Berhasil. SN/Ref:  :5213 9971 1934 0958. Saldo 20.327 - 11.950 = 8.377 @22/08 20:24:03";

    const structure = parseStrukturAlpines(testText);
    console.log("Structure:", JSON.stringify(structure, null, 2));

    const result = extractNominalAlpines(
      testText,
      structure.headerSegment,
      structure.snRefSegment,
      structure.saldoMatch
    );
    console.log("extractNominalAlpines result:", result);

    // The nominal should be 11950 (from the saldo diff with dot separator)
    expect(result.nominal).toBe(11950);
    expect(result.dariSaldoFallback).toBe(true);
  });
});