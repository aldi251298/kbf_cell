/**
 * Notification Generator for Transaction Simulator
 *
 * Generates realistic raw notifications that match the exact format
 * expected by the existing parser for both Digipos and Alpines providers.
 *
 * This generator produces notifications that will be correctly parsed
 * by the existing parser without any modifications.
 */

// ============================================================================
// Types
// ============================================================================

export type Provider = "digipos" | "alpines";

export type DigiposTransactionType =
  "pulsa" | "paket_data" | "paket_nelpon" | "pln";

export type AlpinesTransactionType =
  "pulsa" | "voucher_data" | "ewallet" | "pln" | "tagihan";

export type TransactionType = DigiposTransactionType | AlpinesTransactionType;

export interface GeneratorConfig {
  provider: Provider;
  transactionType: TransactionType;
  product?: string;
  nominal?: number;
  customerNumber?: string;
  customerName?: string;
  timestamp?: Date;
  // Additional fields for specific transaction types
  tokenPln?: string;
  daya?: string;
  kwh?: string;
  sn?: string;
  transactionId?: string;
  saldoAwal?: number;
  saldoAkhir?: number;
  biayaAdmin?: number;
}

export interface GeneratedNotification {
  rawText: string;
  payload: {
    provider: Provider;
    konter_id: string;
    raw_notification_text: string;
    waktu_capture: string;
  };
  metadata: {
    provider: Provider;
    transactionType: TransactionType;
    nominal: number;
    customerNumber?: string;
    timestamp: Date;
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatRupiah(amount: number): string {
  return amount.toLocaleString("id-ID");
}

function formatRupiahWithRp(amount: number): string {
  return `Rp ${formatRupiah(amount)}`;
}

function generateRandomDigits(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

function generateDigiposTransactionId(): string {
  // Format: DGPS + YYMMDD + HHMMSS + random digits
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, "0");
  const dd = now.getDate().toString().padStart(2, "0");
  const hh = now.getHours().toString().padStart(2, "0");
  const mi = now.getMinutes().toString().padStart(2, "0");
  const ss = now.getSeconds().toString().padStart(2, "0");
  const random = generateRandomDigits(11);
  return `DGPS${yy}${mm}${dd}${hh}${mi}${ss}${random}`;
}

function generateAlpinesTransactionId(): string {
  // Format varies by type, e.g., TSBYU15.085198025507, VTR10.0895, etc.
  const prefix = ["TSBYU", "VTR", "AX", "PH", "DNID", "GO", "OV", "BTEL"][
    Math.floor(Math.random() * 8)
  ];
  const randomNum = generateRandomDigits(12);
  return `${prefix}${randomNum.slice(0, 2)}.${randomNum.slice(2)}`;
}

function generateSN(provider: Provider, type: TransactionType): string {
  if (provider === "digipos") {
    // Digipos SN: 04251800000231881088 (20 digits)
    const prefix = type === "pln" ? "0425" : "0425";
    return prefix + generateRandomDigits(16);
  } else {
    // Alpines SN: varies, e.g., 04252400000245405164, 0092420822554939, :5213 9971 1934 0958
    if (type === "voucher_data") {
      return `:${generateRandomDigits(4)} ${generateRandomDigits(4)} ${generateRandomDigits(4)} ${generateRandomDigits(4)}`;
    }
    if (type === "pln") {
      return `${generateRandomDigits(4)}-${generateRandomDigits(4)}-${generateRandomDigits(4)}-${generateRandomDigits(4)}-${generateRandomDigits(4)}`;
    }
    return generateRandomDigits(20);
  }
}

function generateTokenPLN(): string {
  // Format: 3159 4822 1374 2540 9921 (5 groups of 4 digits)
  return Array(5)
    .fill(0)
    .map(() => generateRandomDigits(4))
    .join(" ");
}

function generateNomorMeter(): string {
  // 11 digits
  return generateRandomDigits(11);
}

function formatDateIndonesian(date: Date): string {
  const dd = date.getDate().toString().padStart(2, "0");
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatTimeIndonesian(date: Date): string {
  const hh = date.getHours().toString().padStart(2, "0");
  const mi = date.getMinutes().toString().padStart(2, "0");
  const ss = date.getSeconds().toString().padStart(2, "0");
  return `${hh}:${mi}:${ss}`;
}

function formatAlpinesTimestamp(date: Date): string {
  // Format: @DD/MM HH:MM:SS
  const dd = date.getDate().toString().padStart(2, "0");
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const hh = date.getHours().toString().padStart(2, "0");
  const mi = date.getMinutes().toString().padStart(2, "0");
  const ss = date.getSeconds().toString().padStart(2, "0");
  return `@${dd}/${mm} ${hh}:${mi}:${ss}`;
}

function getRandomProviderSeluler(type: TransactionType): string {
  if (type === "pulsa") {
    const providers = ["Telkomsel", "Axis", "Tri", "Indosat", "XL", "byU"];
    return providers[Math.floor(Math.random() * providers.length)];
  }
  return "";
}

function getRandomEwalletName(): string {
  const wallets = ["DANA", "GoPay", "OVO", "ShopeePay", "LinkAja"];
  return wallets[Math.floor(Math.random() * wallets.length)];
}

function getRandomCustomerName(): string {
  const names = [
    "BUDI SANTOSO",
    "SITI RAHMAWATI",
    "AGUS SETIAWAN",
    "DEWI LESTARI",
    "JOKO WIDODO",
    "RINA KURNIAWATI",
    "HENDRA GUNAWAN",
    "MAYA SARI",
    "ANDI PRATAMA",
    "NURUL HIDAYAH",
    "RYAN FEBRIAN",
    "LINDA MEILANI",
  ];
  return names[Math.floor(Math.random() * names.length)];
}

function getRandomProductDigiposPaketData(): string {
  const products = [
    "Super Seru Internet",
    "Combo Sakti",
    "byU Kaget 11 GB 28 Hari",
    "byU Kaget 33 GB 28 Hari",
    "Paket Nelpon Talkmania Sakti Bulanan",
    "Voucher Internet 5GB",
    "Paket Data 10GB 30 Hari",
  ];
  return products[Math.floor(Math.random() * products.length)];
}

function getRandomProductDigiposPaketNelpon(): string {
  const products = [
    "Talkmania Sakti Bulanan",
    "Paket Nelpon Telkomsel",
    "Combo Nelpon SMS",
  ];
  return products[Math.floor(Math.random() * products.length)];
}

function getRandomProductAlpinesVoucherData(): string {
  const products = [
    "VOUCHER AIGO 5.5 gb 3 hari",
    "Voucher Three 5.5 gb 3 hr",
    "Voucher XL 10GB 7 Hari",
    "Voucher Axis 2GB 30 Hari",
  ];
  return products[Math.floor(Math.random() * products.length)];
}

// ============================================================================
// Digipos Generators
// ============================================================================

function generateDigiposPulsa(config: GeneratorConfig): string {
  const nominal = config.nominal || 20000;
  const customerNumber =
    config.customerNumber || `628${generateRandomDigits(9)}`;
  const sn = config.sn || generateSN("digipos", "pulsa");
  const transactionId = config.transactionId || generateDigiposTransactionId();
  const saldoAwal =
    config.saldoAwal || nominal + 50000 + Math.floor(Math.random() * 100000);
  const saldoAkhir = saldoAwal - nominal - 2000; // -2000 admin fee

  // Real format: "Isi ulang pulsa Rp 20000 untuk no pelanggan 6285126236562 telah berhasil dengan SN 04251800000231881088 dan ID Transaksi DGPS260822194910929804414. Cek sisa stock di *181*1*5*2*PIN#."
  return `Isi ulang pulsa Rp ${formatRupiah(nominal)} untuk no pelanggan ${customerNumber} telah berhasil dengan SN ${sn} dan ID Transaksi ${transactionId}. Cek sisa stock di *181*1*5*2*PIN#.`;
}

function generateDigiposPaketData(config: GeneratorConfig): string {
  const nominal = config.nominal || 30000;
  const customerNumber =
    config.customerNumber || `628${generateRandomDigits(9)}`;
  const sn = config.sn || generateSN("digipos", "paket_data");
  const transactionId = config.transactionId || generateDigiposTransactionId();
  const timestamp = config.timestamp || new Date();
  const product = config.product || getRandomProductDigiposPaketData();
  const saldoAwal =
    config.saldoAwal || nominal + 50000 + Math.floor(Math.random() * 100000);
  const saldoAkhir = saldoAwal - nominal - 2000; // -2000 admin fee
  const dateStr = formatDateIndonesian(timestamp);
  const timeStr = formatTimeIndonesian(timestamp);

  // Real format 1: "Isi ulang paket Super Seru Internet 6282382402102 pd 22/08/2026 14:50:00 berhasil. Voucher senilai Rp30000. Nomor seri 04251200000226014462. Cek sisa stock di *181*1*5*2*PIN#."
  // Real format 2: "Transaksi pengisian paket data byU Kaget 33 GB 28 Hari 28 Hari pada 22 August 2026 04:22:29 senilai Rp72000 telah berhasil. MSISDN: 6285185491964, ID Transaksi: DGPS260822162227613053557. Sisa Saldo Rp. 174.587,00"
  const format = Math.random() > 0.5 ? 1 : 2;

  if (format === 1) {
    return `Isi ulang paket ${product} ${customerNumber} pd ${dateStr} ${timeStr} berhasil. Voucher senilai Rp${formatRupiah(nominal)}. Nomor seri ${sn}. Cek sisa stock di *181*1*5*2*PIN#.`;
  } else {
    // Format date as "22 August 2026 04:22:29"
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthName = months[timestamp.getMonth()];
    const dateStrEn = `${timestamp.getDate()} ${monthName} ${timestamp.getFullYear()} ${timeStr}`;
    return `Transaksi pengisian paket data ${product} ${customerNumber} pada ${dateStrEn} senilai Rp${formatRupiah(nominal)} telah berhasil. MSISDN: ${customerNumber}, ID Transaksi: ${transactionId}. Sisa Saldo Rp. ${formatRupiah(saldoAkhir)},00`;
  }
}

function generateDigiposPaketNelpon(config: GeneratorConfig): string {
  const nominal = config.nominal || 7999;
  const customerNumber =
    config.customerNumber || `628${generateRandomDigits(9)}`;
  const sn = config.sn || generateSN("digipos", "paket_nelpon");
  const timestamp = config.timestamp || new Date();
  const product = config.product || getRandomProductDigiposPaketNelpon();
  const dateStr = formatDateIndonesian(timestamp);
  const timeStr = formatTimeIndonesian(timestamp);

  // Real format: "Isi ulang paket Talkmania Sakti Bulanan 6281374087911 pd 21/08/2026 16:04:39 berhasil. Voucher senilai Rp7999. Nomor seri 04250600000200678066. Cek sisa stock di *181*1*5*2*PIN#."
  return `Isi ulang paket ${product} ${customerNumber} pd ${dateStr} ${timeStr} berhasil. Voucher senilai Rp${formatRupiah(nominal)}. Nomor seri ${sn}. Cek sisa stock di *181*1*5*2*PIN#.`;
}

function generateDigiposPLN(config: GeneratorConfig): string {
  const nominal = config.nominal || 20000;
  const biayaAdmin = config.biayaAdmin || 2400;
  const tokenPln = config.tokenPln || generateTokenPLN();
  const nomorMeter = config.customerNumber || generateNomorMeter();
  const customerName = config.customerName || getRandomCustomerName();
  const transactionId = config.transactionId || generateDigiposTransactionId();
  const timestamp = config.timestamp || new Date();
  const daya = config.daya || "450VA";
  const kwh = config.kwh || "43,9 kWh";
  const saldoAwal =
    config.saldoAwal ||
    nominal + biayaAdmin + 50000 + Math.floor(Math.random() * 100000);
  const dateStr = `${timestamp.getDate().toString().padStart(2, "0")}-${(timestamp.getMonth() + 1).toString().padStart(2, "0")}-${timestamp.getFullYear()}`;
  const timeStr = formatTimeIndonesian(timestamp);

  // Real format: "Anda telah melakukan pembayaran PLN senilai 20000 pada 21-08-2026 15:58:04 Biaya admin 2400. ID Transaksi DGPS260821155753231533607 Saldo LinkAja 186386. Token PLN Prabayar Anda 3159 4822 1374 2540 9921. Nometer 86278933436 atas nama RUSTAM DT INDO BUMI. 43,9 kWh"
  return `Anda telah melakukan pembayaran PLN senilai ${nominal} pada ${dateStr} ${timeStr} Biaya admin ${biayaAdmin}. ID Transaksi ${transactionId} Saldo LinkAja ${saldoAwal}. Token PLN Prabayar Anda ${tokenPln}. Nometer ${nomorMeter} atas nama ${customerName}. ${daya}/${kwh}`;
}

// ============================================================================
// Alpines Generators
// ============================================================================

function generateAlpinesPulsa(config: GeneratorConfig): string {
  const nominal = config.nominal || 15000;
  const sn = config.sn || generateSN("alpines", "pulsa");
  const timestamp = config.timestamp || new Date();
  const providerSeluler = getRandomProviderSeluler("pulsa");
  const productCode =
    providerSeluler === "Telkomsel"
      ? "TSBYU"
      : providerSeluler === "Axis"
        ? "AX"
        : "TR";
  const nominalWithFee = nominal + 550; // Alpines includes admin fee in saldo diff
  const saldoAwal =
    config.saldoAwal ||
    nominalWithFee + 50000 + Math.floor(Math.random() * 100000);
  const saldoAkhir = saldoAwal - nominalWithFee;
  const alpinesTimestamp = formatAlpinesTimestamp(timestamp);

  // Real format: "Telkomsel BYU 15000 TSBYU15.085165745482 Berhasil. SN/Ref: 04252400000245405164. Saldo 1.257.427 - 15.550 = 1.241.877 @23/08 19:23:59"
  // "Axis Reguler 30000 AX30.083877750811 Berhasil. SN/Ref: 0092420822554939. Saldo 773.577 - 30.650 = 742.927 @22/08 11:04:47"
  const productName = providerSeluler === "Telkomsel" ? "BYU" : "Reguler";
  const header = `${providerSeluler} ${productName} ${nominal} ${productCode}${generateRandomDigits(12)} Berhasil.`;
  const snRef = `SN/Ref: ${sn}.`;
  const saldo = `Saldo ${formatRupiah(saldoAwal)} - ${formatRupiah(nominalWithFee)} = ${formatRupiah(saldoAkhir)} ${alpinesTimestamp}`;

  return `${header} ${snRef} ${saldo}`;
}

function generateAlpinesVoucherData(config: GeneratorConfig): string {
  const nominal = config.nominal || 11950;
  const sn = config.sn || generateSN("alpines", "voucher_data");
  const transactionId = config.transactionId || generateAlpinesTransactionId();
  const timestamp = config.timestamp || new Date();
  const product = config.product || getRandomProductAlpinesVoucherData();
  const nominalWithFee = nominal + 1000; // approximate admin fee
  const saldoAwal =
    config.saldoAwal ||
    nominalWithFee + 50000 + Math.floor(Math.random() * 100000);
  const saldoAkhir = saldoAwal - nominalWithFee;
  const alpinesTimestamp = formatAlpinesTimestamp(timestamp);

  // Real format: "VOUCHER AIGO 5.5 gb 3 hari    *838*nomor voucher# VA5.0838 Berhasil. SN/Ref:  :5213 9971 1934 0958. Saldo 20.327 - 11950 = 8.377 @22/08 20:24:03"
  // "Voucher Three 5.5 gb 3 hr   *888*Nomor Sn# VTR10.0895 Berhasil. SN/Ref:  :1583 0278 6596 2336. Saldo 422.877 - 13150 = 409.727 @23/08 20:47:15"
  const prefix = product.startsWith("VOUCHER") ? "VOUCHER" : "Voucher";
  const productName = product.replace(/^(VOUCHER|Voucher)\s+/i, "");
  const codePrefix = productName.includes("AIGO")
    ? "*838*nomor voucher#"
    : "*888*Nomor Sn#";
  const header = `${prefix} ${productName}   ${codePrefix} ${transactionId} Berhasil.`;
  const snRef = `SN/Ref:  ${sn}.`;
  const saldo = `Saldo ${formatRupiah(saldoAwal)} - ${formatRupiah(nominal)} = ${formatRupiah(saldoAkhir)} ${alpinesTimestamp}`;

  return `${header} ${snRef} ${saldo}`;
}

function generateAlpinesEwallet(config: GeneratorConfig): string {
  const nominal = config.nominal || 200000;
  const customerNumber =
    config.customerNumber || `628${generateRandomDigits(9)}`;
  const transactionId = config.transactionId || generateAlpinesTransactionId();
  const timestamp = config.timestamp || new Date();
  const ewalletName = getRandomEwalletName();
  const customerName = config.customerName || getRandomCustomerName();
  const nominalWithFee = nominal + 650; // approximate admin fee
  const saldoAwal =
    config.saldoAwal ||
    nominalWithFee + 500000 + Math.floor(Math.random() * 500000);
  const saldoAkhir = saldoAwal - nominalWithFee;
  const alpinesTimestamp = formatAlpinesTimestamp(timestamp);

  // Real format: "Saldo dana DANA200.082279141693 Berhasil. SN/Ref: NAMA:DNID-VIOXX ALYXXX/NOMINAL:200000/IDT:2026082310121481030100166859069335373. Saldo 1.937.077 - 201.150 = 1.735.927 @23/08 13:43:36"
  // "Saldo dana DANA10.082171536241 Berhasil. SN/Ref: NAMA:DNID-ARNXXX RATXX DEWX/NOMINAL:10000/IDT:2026082310121481030100166412471781889. Saldo 1.268.077 - 10.650 = 1.257.427 @23/08 18:51:42"
  const header = `Saldo dana ${ewalletName}${nominal}.${customerNumber.slice(-8)} Berhasil.`;
  const snRef = `SN/Ref: NAMA:DNID-${customerName.replace(" ", "XX")}/NOMINAL:${nominal}/IDT:${transactionId}.`;
  const saldo = `Saldo ${formatRupiah(saldoAwal)} - ${formatRupiah(nominalWithFee)} = ${formatRupiah(saldoAkhir)} ${alpinesTimestamp}`;
  return `${header} ${snRef} ${saldo}`;
}

function generateAlpinesPLN(config: GeneratorConfig): string {
  const nominal = config.nominal || 20000;
  const customerName = config.customerName || getRandomCustomerName();
  const timestamp = config.timestamp || new Date();
  const daya = config.daya || "450VA";
  const kwh = config.kwh || "43,9 kWh";
  const nominalWithFee = nominal + 2450; // approximate admin fee
  const saldoAwal =
    config.saldoAwal ||
    nominalWithFee + 50000 + Math.floor(Math.random() * 100000);
  const saldoAkhir = saldoAwal - nominalWithFee;
  const alpinesTimestamp = formatAlpinesTimestamp(timestamp);
  const sn = config.sn || generateSN("alpines", "pln");

  // Real format: "TOKEN 20000 PH20.50160790239 Berhasil. SN/Ref: 5185-7612-4324-7979-7585/LASKAR/R1/450VA/43,9kwh.. Saldo 59.527 - 22.450 = 37.077 @23/08 21:11:12"
  const header = `TOKEN ${nominal} PH${generateRandomDigits(2)}.${generateRandomDigits(11)} Berhasil.`;
  const snRef = `SN/Ref: ${sn}/${customerName}/R1/${daya}/${kwh.replace(" ", "")}..`;
  const saldo = `Saldo ${formatRupiah(saldoAwal)} - ${formatRupiah(nominalWithFee)} = ${formatRupiah(saldoAkhir)} ${alpinesTimestamp}`;

  return `${header} ${snRef} ${saldo}`;
}

function generateAlpinesTagihan(config: GeneratorConfig): string {
  const nominal = config.nominal || 318850;
  const biayaAdmin = 2500;
  const nominalTagihan = nominal - biayaAdmin;
  const customerNumber = config.customerNumber || generateRandomDigits(12);
  const timestamp = config.timestamp || new Date();
  const customerName = config.customerName || getRandomCustomerName();
  const periode = `${timestamp.getFullYear()}${(timestamp.getMonth() + 1).toString().padStart(2, "0")}`;
  const nominalWithFee = nominal;
  const saldoAwal =
    config.saldoAwal ||
    nominalWithFee + 100000 + Math.floor(Math.random() * 500000);
  const saldoAkhir = saldoAwal - nominalWithFee;
  const alpinesTimestamp = formatAlpinesTimestamp(timestamp);

  // Real format: "BAYAR TAGIHAN TELKOM BTEL.111452102552 Berhasil. SN/Ref: NOFRITA DEWI/1Lbr/Periode:202608/Rp.318850/979981323608A/Adm2500/RpTag316350/111452102552,. Saldo 409.727 - 319.550 = 90.177 @23/08 20:59:42"
  const header = `BAYAR TAGIHAN TELKOM BTEL.${customerNumber} Berhasil.`;
  const snRef = `SN/Ref: ${customerName}/1Lbr/Periode:${periode}/Rp.${nominal}/${customerNumber}A/Adm${biayaAdmin}/RpTag${nominalTagihan}/${customerNumber},.`;
  const saldo = `Saldo ${formatRupiah(saldoAwal)} - ${formatRupiah(nominalWithFee)} = ${formatRupiah(saldoAkhir)} ${alpinesTimestamp}`;

  return `${header} ${snRef} ${saldo}`;
}

// ============================================================================
// Main Generator Function
// ============================================================================

export function generateNotification(
  config: GeneratorConfig,
): GeneratedNotification {
  const timestamp = config.timestamp || new Date();
  const konterId = "KONTER-001"; // Default konter

  let rawText: string;

  if (config.provider === "digipos") {
    switch (config.transactionType) {
      case "pulsa":
        rawText = generateDigiposPulsa(config);
        break;
      case "paket_data":
        rawText = generateDigiposPaketData(config);
        break;
      case "paket_nelpon":
        rawText = generateDigiposPaketNelpon(config);
        break;
      case "pln":
        rawText = generateDigiposPLN(config);
        break;
      default:
        throw new Error(
          `Unknown Digipos transaction type: ${config.transactionType}`,
        );
    }
  } else {
    switch (config.transactionType) {
      case "pulsa":
        rawText = generateAlpinesPulsa(config);
        break;
      case "voucher_data":
        rawText = generateAlpinesVoucherData(config);
        break;
      case "ewallet":
        rawText = generateAlpinesEwallet(config);
        break;
      case "pln":
        rawText = generateAlpinesPLN(config);
        break;
      case "tagihan":
        rawText = generateAlpinesTagihan(config);
        break;
      default:
        throw new Error(
          `Unknown Alpines transaction type: ${config.transactionType}`,
        );
    }
  }

  const nominal = config.nominal || 0;

  return {
    rawText,
    payload: {
      provider: config.provider,
      konter_id: konterId,
      raw_notification_text: rawText,
      waktu_capture: timestamp.toISOString(),
    },
    metadata: {
      provider: config.provider,
      transactionType: config.transactionType,
      nominal,
      customerNumber: config.customerNumber,
      timestamp,
    },
  };
}

// ============================================================================
// Preset Configurations (matching the acceptance test cases)
// ============================================================================

export const PRESETS: Record<string, GeneratorConfig> = {
  // ALPINES
  "ALPINES — DANA 200K": {
    provider: "alpines",
    transactionType: "ewallet",
    product: "DANA",
    nominal: 200000,
  },
  "ALPINES — DANA 10K": {
    provider: "alpines",
    transactionType: "ewallet",
    product: "DANA",
    nominal: 10000,
  },
  "ALPINES — TOKEN PLN": {
    provider: "alpines",
    transactionType: "pln",
    nominal: 20000,
  },
  "ALPINES — PULSA TELKOMSEL": {
    provider: "alpines",
    transactionType: "pulsa",
    nominal: 15000,
  },
  "ALPINES — PULSA AXIS": {
    provider: "alpines",
    transactionType: "pulsa",
    nominal: 30000,
  },
  "ALPINES — VOUCHER DATA AIGO": {
    provider: "alpines",
    transactionType: "voucher_data",
    nominal: 11950,
  },
  "ALPINES — VOUCHER DATA THREE": {
    provider: "alpines",
    transactionType: "voucher_data",
    nominal: 13150,
  },
  "ALPINES — TELKOM": {
    provider: "alpines",
    transactionType: "tagihan",
    nominal: 318850,
  },

  // DIGIPOS
  "DIGIPOS — PLN 20K": {
    provider: "digipos",
    transactionType: "pln",
    nominal: 20000,
  },
  "DIGIPOS — PLN 100K": {
    provider: "digipos",
    transactionType: "pln",
    nominal: 100000,
  },
  "DIGIPOS — PULSA 20K": {
    provider: "digipos",
    transactionType: "pulsa",
    nominal: 20000,
  },
  "DIGIPOS — PULSA 55K": {
    provider: "digipos",
    transactionType: "pulsa",
    nominal: 55000,
  },
  "DIGIPOS — PAKET DATA SUPER SERU": {
    provider: "digipos",
    transactionType: "paket_data",
    product: "Super Seru Internet",
    nominal: 30000,
  },
  "DIGIPOS — PAKET DATA BYU KAGET": {
    provider: "digipos",
    transactionType: "paket_data",
    product: "byU Kaget 33 GB 28 Hari",
    nominal: 72000,
  },
  "DIGIPOS — TALKMANIA": {
    provider: "digipos",
    transactionType: "paket_nelpon",
    product: "Talkmania Sakti Bulanan",
    nominal: 7999,
  },
};

// ============================================================================
// Valid Transaction Type Mappings per Provider
// ============================================================================

export const VALID_TRANSACTION_TYPES: Record<Provider, TransactionType[]> = {
  digipos: ["pulsa", "paket_data", "paket_nelpon", "pln"],
  alpines: ["pulsa", "voucher_data", "ewallet", "pln", "tagihan"],
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  pulsa: "Pulsa",
  paket_data: "Paket Data",
  paket_nelpon: "Paket Nelpon",
  pln: "Token PLN",
  voucher_data: "Voucher Data",
  ewallet: "E-Wallet",
  tagihan: "Tagihan",
};

export const PRODUCT_OPTIONS: Record<
  Provider,
  Partial<Record<TransactionType, string[]>>
> = {
  digipos: {
    pulsa: ["Telkomsel", "Axis", "Tri", "Indosat", "XL", "byU"],
    paket_data: [
      "Super Seru Internet",
      "Combo Sakti",
      "byU Kaget 11 GB 28 Hari",
      "byU Kaget 33 GB 28 Hari",
    ],
    paket_nelpon: [
      "Talkmania Sakti Bulanan",
      "Paket Nelpon Telkomsel",
      "Combo Nelpon SMS",
    ],
    pln: [
      "Token PLN 20.000",
      "Token PLN 50.000",
      "Token PLN 100.000",
      "Token PLN 200.000",
      "Token PLN 500.000",
      "Token PLN 1.000.000",
    ],
  },
  alpines: {
    pulsa: ["Telkomsel BYU", "Axis Reguler", "Tri", "Indosat IM3", "XL"],
    voucher_data: [
      "VOUCHER AIGO 5.5 gb 3 hari",
      "Voucher Three 5.5 gb 3 hr",
      "Voucher XL 10GB 7 Hari",
      "Voucher Axis 2GB 30 Hari",
    ],
    ewallet: ["DANA", "GoPay", "OVO", "ShopeePay", "LinkAja"],
    pln: [
      "Token PLN 20.000",
      "Token PLN 50.000",
      "Token PLN 100.000",
      "Token PLN 200.000",
      "Token PLN 500.000",
      "Token PLN 1.000.000",
    ],
    tagihan: [
      "BAYAR TAGIHAN TELKOM",
      "BAYAR TAGIHAN PLN",
      "BAYAR TAGIHAN PDAM",
      "BAYAR TAGIHAN BPJS",
    ],
  },
};

// ============================================================================
// Random Transaction Generator
// ============================================================================

export function generateRandomTransaction(): GeneratorConfig {
  const providers: Provider[] = ["digipos", "alpines"];
  const provider = providers[Math.floor(Math.random() * providers.length)];
  const validTypes = VALID_TRANSACTION_TYPES[provider];
  const transactionType =
    validTypes[Math.floor(Math.random() * validTypes.length)];
  const products = PRODUCT_OPTIONS[provider][transactionType] || [];
  const product =
    products.length > 0
      ? products[Math.floor(Math.random() * products.length)]
      : "";

  // Nominal ranges per type
  let nominal: number;
  switch (transactionType) {
    case "pulsa":
      nominal = [5000, 10000, 15000, 20000, 25000, 30000, 50000, 100000][
        Math.floor(Math.random() * 8)
      ];
      break;
    case "paket_data":
    case "voucher_data":
      nominal = [10000, 15000, 20000, 25000, 30000, 50000, 75000, 100000][
        Math.floor(Math.random() * 8)
      ];
      break;
    case "paket_nelpon":
      nominal = [5000, 7999, 10000, 15000, 20000][
        Math.floor(Math.random() * 5)
      ];
      break;
    case "pln":
      nominal = [20000, 50000, 100000, 200000, 500000, 1000000][
        Math.floor(Math.random() * 6)
      ];
      break;
    case "ewallet":
      nominal = [10000, 20000, 50000, 100000, 200000, 500000, 1000000][
        Math.floor(Math.random() * 7)
      ];
      break;
    case "tagihan":
      nominal = [50000, 100000, 200000, 300000, 500000, 1000000][
        Math.floor(Math.random() * 6)
      ];
      break;
    default:
      nominal = 20000;
  }

  return {
    provider,
    transactionType,
    product,
    nominal,
    customerNumber: `628${generateRandomDigits(9)}`,
    customerName: getRandomCustomerName(),
    timestamp: new Date(),
  };
}

// ============================================================================
// Batch Generator
// ============================================================================

export function generateBatchTransactions(count: number): GeneratorConfig[] {
  const transactions: GeneratorConfig[] = [];
  for (let i = 0; i < count; i++) {
    transactions.push(generateRandomTransaction());
  }
  return transactions;
}
