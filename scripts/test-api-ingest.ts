// Test cases with different nominal values
const testCases = [
  {
    name: "Test 1 - Nominal 11950 (original user case)",
    rawText: "VOUCHER AIGO 5.5 gb 3 hari    *838*nomor voucher# VA5.0838 Berhasil. SN/Ref:  :5213 9971 1934 0958. Saldo 20.327 - 11950 = 8.377 @22/08 20:24:03",
    expectedNominal: 11950,
  },
  {
    name: "Test 2 - Nominal 25000 (with dot thousand separator in potongan)",
    rawText: "VOUCHER AIGO 10 gb 7 hari    *838*nomor voucher# VA5.0839 Berhasil. SN/Ref:  :5213 9971 1934 0959. Saldo 50.000 - 25.000 = 25.000 @22/08 21:00:00",
    expectedNominal: 25000,
  },
  {
    name: "Test 3 - Nominal 50000 (larger amount)",
    rawText: "VOUCHER AIGO 20 gb 30 hari    *838*nomor voucher# VA5.0840 Berhasil. SN/Ref:  :5213 9971 1934 0960. Saldo 100.000 - 50.000 = 50.000 @22/08 22:00:00",
    expectedNominal: 50000,
  },
];

async function testIngest() {
  const baseUrl = "http://localhost:3000";
  const konterId = "KONTER-001"; // Use existing konter from seed
  const provider = "alpines";
  const waktuCapture = new Date().toISOString();

  console.log("=== Testing API Ingestion with 3 Different Nominal Values ===\n");
  console.log(`Target: ${baseUrl}/api/ingest/transaksi\n`);

  for (const testCase of testCases) {
    console.log(`\n--- ${testCase.name} ---`);
    console.log(`Input: ${testCase.rawText}`);
    console.log(`Expected nominal: ${testCase.expectedNominal}`);

    try {
      // Call the ingestion API
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
        console.log(`Actual nominal from API: ${actualNominal}`);
        
        if (actualNominal === testCase.expectedNominal) {
          console.log("✅ PASS: Nominal matches expected value");
        } else {
          console.log(`❌ FAIL: Expected ${testCase.expectedNominal}, got ${actualNominal}`);
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