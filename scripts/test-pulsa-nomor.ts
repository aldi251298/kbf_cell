// Test to verify nomor_tujuan is still required for pulsa
const testCases = [
  {
    name: "Test Pulsa - WITH nomor tujuan (should NOT need review for nomor)",
    rawText: "Telkomsel 50000 TSBYU15.085198025507 Berhasil. SN/Ref: 04250500000210620925. Saldo 100000 - 50000 = 50000 @21/08 22:34:22",
    expectedNominal: 50000,
    expectedPerluReview: false, // Should not need review since nomor_tujuan is present
  },
  {
    name: "Test Pulsa - WITHOUT nomor tujuan (SHOULD need review)",
    rawText: "Telkomsel 50000 TSBYU15.085198025507 Berhasil. SN/Ref: . Saldo 100000 - 50000 = 50000 @21/08 22:34:22",
    expectedNominal: 50000,
    expectedPerluReview: true, // Should need review since nomor_tujuan is missing for pulsa
  },
  {
    name: "Test Paket Data - WITHOUT nomor tujuan (should NOT need review for nomor)",
    rawText: "VOUCHER AIGO 5.5 gb 3 hari    *838*nomor voucher# VA5.0838 Berhasil. SN/Ref:  :5213 9971 1934 0958. Saldo 20.327 - 11950 = 8.377 @22/08 20:24:03",
    expectedNominal: 11950,
    expectedPerluReview: false, // Should not need review for nomor_tujuan (paket_data doesn't require it)
  },
];

async function testIngest() {
  const baseUrl = "http://localhost:3000";
  const konterId = "KONTER-001";
  const provider = "alpines";
  const waktuCapture = new Date().toISOString();

  console.log("=== Testing nomor_tujuan requirement for different transaction types ===\n");

  for (const testCase of testCases) {
    console.log(`\n--- ${testCase.name} ---`);
    console.log(`Input: ${testCase.rawText}`);
    console.log(`Expected nominal: ${testCase.expectedNominal}`);
    console.log(`Expected perlu_review: ${testCase.expectedPerluReview}`);

    try {
      const response = await fetch(`${baseUrl}/api/ingest/transaksi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          konter_id: konterId,
          raw_notification_text: testCase.rawText,
          waktu_capture: waktuCapture,
        }),
      });

      const result = await response.json();
      console.log(`Response status: ${response.status}`);
      console.log(`Response:`, JSON.stringify(result, null, 2));

      if (result.success && result.data) {
        const actualNominal = result.data.nominal;
        const actualPerluReview = result.data.perlu_review;
        console.log(`Actual nominal: ${actualNominal}`);
        console.log(`Actual perlu_review: ${actualPerluReview}`);
        
        if (actualNominal === testCase.expectedNominal && actualPerluReview === testCase.expectedPerluReview) {
          console.log("✅ PASS: Matches expected values");
        } else {
          console.log(`❌ FAIL: Expected nominal=${testCase.expectedNominal}, perlu_review=${testCase.expectedPerluReview}`);
        }
      } else {
        console.log("❌ FAIL: API returned error or no data");
      }
    } catch (error) {
      console.error(`❌ ERROR: ${error}`);
    }
  }

  console.log("\n=== Test Complete ===");
}

testIngest().catch(console.error);