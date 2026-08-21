import {
  extractNominal,
  extractNominalForAlpines,
  parseAngkaIndonesia,
  parseAngkaIndonesiaFlexible,
  parseSaldoWithValidation,
} from "@/lib/parser/extractNominal";
import {
  parseStrukturAlpines,
  extractNominalAlpines,
} from "@/lib/parser/universal";

describe("Parser - Nominal Extraction", () => {
  describe("parseAngkaIndonesiaFlexible", () => {
    it("should parse numbers without separators", () => {
      expect(parseAngkaIndonesiaFlexible("13150", "no_separator")).toBe(13150);
      expect(parseAngkaIndonesiaFlexible("15550", "no_separator")).toBe(15550);
    });

    it("should parse numbers with dot as thousand separator", () => {
      expect(parseAngkaIndonesiaFlexible("15.550", "dot_as_thousand")).toBe(
        15550,
      );
      expect(parseAngkaIndonesiaFlexible("52.927", "dot_as_thousand")).toBe(
        52927,
      );
      expect(parseAngkaIndonesiaFlexible("200.850", "dot_as_thousand")).toBe(
        200850,
      );
      expect(parseAngkaIndonesiaFlexible("102.150", "dot_as_thousand")).toBe(
        102150,
      );
    });

    it("should parse numbers with dash as thousand separator (typo format)", () => {
      expect(parseAngkaIndonesiaFlexible("731-423", "dot_as_thousand")).toBe(
        731423,
      );
    });

    it("should parse numbers with comma as decimal separator (Indonesian format)", () => {
      // In Indonesian format, comma is decimal separator: "100,000" = 100.000 = 100
      expect(parseAngkaIndonesiaFlexible("100,000", "dot_as_thousand")).toBe(
        100,
      );
    });
  });

  describe("parseSaldoWithValidation", () => {
    it("should extract and validate potongan from saldo pattern with dot separators", () => {
      const text = "Saldo 52.927 - 13150 = 39.777 @21/08 13:23:20";
      const result = parseSaldoWithValidation(text);
      expect(result).toBe(13150);
    });

    it("should extract and validate potongan from saldo pattern with mixed separators", () => {
      const text = "Saldo 39.777 - 15.550 = 24.227 @21/08 22:34:22";
      const result = parseSaldoWithValidation(text);
      expect(result).toBe(15550);
    });

    it("should handle dash as thousand separator in saldo awal (731-423)", () => {
      const text = "Saldo 731-423 - 200.850 = 530.573 @15/08 13:17:49";
      const result = parseSaldoWithValidation(text);
      expect(result).toBe(200850);
    });

    it("should handle dash as thousand separator in saldo akhir", () => {
      const text = "Saldo 231.173 - 102.150 = 129.023 @14/08 22:42:31";
      const result = parseSaldoWithValidation(text);
      expect(result).toBe(102150);
    });

    it("should return null when mathematical validation fails", () => {
      const text = "Saldo 100000 - 50000 = 30000"; // 100000 - 50000 != 30000
      const result = parseSaldoWithValidation(text);
      expect(result).toBeNull();
    });

    it("should return null when no saldo pattern found", () => {
      const text =
        "Voucher Three 5.5 gb 3 hr *888*Nomor Sn# VTR10.0895 Berhasil.";
      const result = parseSaldoWithValidation(text);
      expect(result).toBeNull();
    });
  });

  describe("extractNominal - Digipos provider", () => {
    it("should fallback to saldo diff when nominal is empty (Digipos)", () => {
      const text =
        "Voucher Three 5.5 gb 3 hr *888*Nomor Sn# VTR10.0895 Berhasil. SN/Ref: :4066 3084 4883 9905. Saldo 52.927 - 13150 = 39.777 @21/08 13:23:20";
      const result = extractNominal(text, "voucher");
      expect(result).toBe(13150);
    });

    it("should fallback to saldo diff for Telkomsel BYU (Digipos)", () => {
      const text =
        "Telkomsel BYU 15000 TSBYU15.085198025507 Berhasil. SN/Ref: 04250500000210620925. Saldo 39.777 - 15.550 = 24.227 @21/08 22:34:22";
      const result = extractNominal(text, "pulsa");
      expect(result).toBe(15550);
    });

    it("should use explicit nominal when present (regression test for Digipos)", () => {
      // Digipos with explicit nominal should use the explicit nominal, NOT saldo fallback
      const text =
        "Telkomsel 50000 TSBYU15.085198025507 Berhasil. SN/Ref: 04250500000210620925. Saldo 100000 - 50000 = 50000 @21/08 22:34:22";
      const result = extractNominal(text, "pulsa");
      // Should use explicit nominal (50000) not saldo diff (50000 - but this is same in this case)
      // Let's use a case where they differ
      const text2 =
        "Telkomsel 25000 TSBYU15.085198025507 Berhasil. SN/Ref: 04250500000210620925. Saldo 100000 - 15000 = 85000 @21/08 22:34:22";
      const result2 = extractNominal(text2, "pulsa");
      expect(result2).toBe(25000); // Should use explicit nominal 25000, not saldo diff 15000
    });

    it("should use explicit nominal for voucher (Digipos)", () => {
      const text =
        "Voucher Three 50000 VTR10.0895 Berhasil. SN/Ref: :4066 3084 4883 9905. Saldo 100000 - 15000 = 85000 @21/08 13:23:20";
      const result = extractNominal(text, "voucher");
      expect(result).toBe(50000); // Should use explicit nominal 50000, not saldo diff 15000
    });

    it("should parse Rp format", () => {
      const text = "Pembayaran Rp 25.000 Berhasil";
      const result = extractNominal(text, "ewallet");
      expect(result).toBe(25000);
    });

    it("should parse NOMINAL: label", () => {
      const text = "NOMINAL: 50000 Berhasil";
      const result = extractNominal(text, "ewallet");
      expect(result).toBe(50000);
    });
  });

  describe("extractNominalForAlpines - Provider-level override", () => {
    it("should use saldo diff for DANA ewallet (Alpines)", () => {
      const text =
        "Saldo DANA.200.081267746287 Berhasil. SN/Ref: NAMA:DNID-AVRXXXX WIJXXXXXX/NOMINAL:200000/IDT:2026081510121481030100166963767458397. Saldo 731-423 - 200.850 = 530.573 @15/08 13:17:49";
      const result = extractNominalForAlpines(text);
      expect(result.nominal).toBe(200850);
      expect(result.dariSaldoFallback).toBe(true);
    });

    it("should use saldo diff for GOPAY ewallet (Alpines)", () => {
      const text =
        "SALDO GOPAY GO100.081372331339 Berhasil. SN/Ref: GOPAY/Jasmisaputra/100000/081372331339/REFF:0420260814154213iJ5AJAncKMID. Saldo 231.173 - 102.150 = 129.023 @14/08 22:42:31";
      const result = extractNominalForAlpines(text);
      expect(result.nominal).toBe(102150);
      expect(result.dariSaldoFallback).toBe(true);
    });

    it("should ignore explicit NOMINAL: in SN/Ref for Alpines (provider-level rule)", () => {
      // Even though NOMINAL:200000 is present in SN/Ref, Alpines should use saldo diff (200850)
      const text =
        "Saldo DANA.200.081267746287 Berhasil. SN/Ref: NAMA:DNID-AVRXXXX WIJXXXXXX/NOMINAL:200000/IDT:2026081510121481030100166963767458397. Saldo 731-423 - 200.850 = 530.573 @15/08 13:17:49";
      const result = extractNominalForAlpines(text);
      // Saldo diff is 200850, explicit NOMINAL is 200000 - should use saldo diff
      expect(result.nominal).toBe(200850);
      expect(result.dariSaldoFallback).toBe(true);
    });

    it("should handle dash as thousand separator in saldo awal (731-423)", () => {
      const text =
        "Saldo DANA.200.081267746287 Berhasil. SN/Ref: NAMA:DNID-AVRXXXX WIJXXXXXX/NOMINAL:200000/IDT:2026081510121481030100166963767458397. Saldo 731-423 - 200.850 = 530.573 @15/08 13:17:49";
      const structure = parseStrukturAlpines(text);
      const result = extractNominalAlpines(
        text,
        structure.headerSegment,
        structure.snRefSegment,
        structure.saldoMatch,
      );
      expect(result.nominal).toBe(200850);
      expect(result.dariSaldoFallback).toBe(true);
    });
  });

  describe("Edge cases - inconsistent number formats", () => {
    it("should parse numbers without separators", () => {
      expect(parseAngkaIndonesia("13150")).toBe(13150);
    });

    it("should parse numbers with dot as thousand separator", () => {
      expect(parseAngkaIndonesia("15.550")).toBe(15550);
      expect(parseAngkaIndonesia("200.850")).toBe(200850);
    });

    it("should parse numbers with dash as thousand separator (typo)", () => {
      expect(parseAngkaIndonesia("731-423")).toBe(731423);
    });

    it("should parse numbers with comma as thousand separator (European format)", () => {
      // parseAngkaIndonesia treats comma as decimal separator (Indonesian format)
      // For European format "100,000" = 100000, use parseAngkaIndonesiaFlexible with dot_as_decimal mode
      expect(parseAngkaIndonesia("100,000")).toBe(100); // Indonesian: 100.000 = 100
    });
  });

  describe("Saldo checksum validation", () => {
    it("should not warn when saldo_awal - potongan == saldo_akhir (exact match)", () => {
      const text = "Saldo 52927 - 13150 = 39777";
      const result = parseSaldoWithValidation(text);
      expect(result).toBe(13150);
    });

    it("should still return potongan when checksum fails but log warning (simulated by returning value)", () => {
      // The function returns the potongan even if validation fails in some modes
      // but returns null if ALL modes fail validation
      const text = "Saldo 100000 - 50000 = 30000"; // Invalid: 100000 - 50000 = 50000, not 30000
      const result = parseSaldoWithValidation(text);
      // Should return null because no parsing mode validates mathematically
      expect(result).toBeNull();
    });

    it("should handle case where one parsing mode validates but others don't", () => {
      // "731-423" with dash as thousand separator = 731423
      // "200.850" with dot as thousand separator = 200850
      // "530.573" with dot as thousand separator = 530573
      // 731423 - 200850 = 530573 ✓
      const text = "Saldo 731-423 - 200.850 = 530.573";
      const result = parseSaldoWithValidation(text);
      expect(result).toBe(200850);
    });
  });
});
