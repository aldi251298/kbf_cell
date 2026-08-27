/**
 * Konfigurasi Logo Brand — mapping keyword → path file SVG asli di public/assets/brands/
 * NAMA FILE HARUS SAMA PERSIS (case-sensitive) dengan file di folder brands.
 * Jangan buat entry untuk brand yang SVG-nya belum tersedia.
 */

const BRAND_KEYWORDS: { keywords: string[]; logoPath: string }[] = [
  // Telkomsel & sub-brand (by.U, Kaget, OMG, Talkmania)
  {
    keywords: [
      "telkomsel",
      "byu",
      "by.u",
      "kaget",
      "omg",
      "talkmania",
      "simpati",
      "as",
    ],
    logoPath: "/assets/brands/Telkomsel.svg",
  },
  // AXIS
  {
    keywords: ["axis", "aigo"],
    logoPath: "/assets/brands/AXIS.svg",
  },
  // Indosat / IM3
  {
    keywords: ["indosat", "im3", "mentari"],
    logoPath: "/assets/brands/Indosat.svg",
  },
  // Tri (Three)
  {
    keywords: ["tri", "three", " 3 "],
    logoPath: "/assets/brands/Tri.svg",
  },
  // XL
  {
    keywords: ["xl", "xl axtra", "axiata"],
    logoPath: "/assets/brands/XL.svg",
  },
  // Smartfren
  {
    keywords: ["smartfren", "fren"],
    logoPath: "/assets/brands/Smartfren.svg",
  },
  // PLN
  {
    keywords: ["pln", "token listrik", "stroom", "meter"],
    logoPath: "/assets/brands/PLN.svg",
  },
  // DANA
  {
    keywords: ["dana"],
    logoPath: "/assets/brands/Dana.svg",
  },
  // GoPay
  {
    keywords: ["gopay", "go-pay"],
    logoPath: "/assets/brands/GoPay.svg",
  },
  // OVO
  {
    keywords: ["ovo"],
    logoPath: "/assets/brands/OVO.svg",
  },
  // ShopeePay
  {
    keywords: ["shopeepay", "shopee pay"],
    logoPath: "/assets/brands/ShopeePay.svg",
  },
];

/**
 * Tipe operator seluler yang didukung
 */
export type BrandOperator =
  | "telkomsel"
  | "axis"
  | "indosat"
  | "tri"
  | "xl"
  | "smartfren"
  | "pln"
  | "dana"
  | "gopay"
  | "ovo"
  | "shopeepay"
  | "unknown";

/**
 * Mapping operator → path logo
 */
const OPERATOR_LOGO_MAP: Record<BrandOperator, string> = {
  telkomsel: "/assets/brands/Telkomsel.svg",
  axis: "/assets/brands/AXIS.svg",
  indosat: "/assets/brands/Indosat.svg",
  tri: "/assets/brands/Tri.svg",
  xl: "/assets/brands/XL.svg",
  smartfren: "/assets/brands/Smartfren.svg",
  pln: "/assets/brands/PLN.svg",
  dana: "/assets/brands/Dana.svg",
  gopay: "/assets/brands/GoPay.svg",
  ovo: "/assets/brands/OVO.svg",
  shopeepay: "/assets/brands/ShopeePay.svg",
  unknown: "/assets/brands/generic-sim.svg",
};

/**
 * Deteksi operator seluler dari field providerSeluler dan namaProduk
 * Prioritas: providerSeluler (explisit) > namaProduk (keyword matching)
 */
export function deteksiOperatorSeluler(
  providerSeluler?: string | null,
  namaProduk?: string | null,
): BrandOperator {
  // Gabungkan kedua sumber, lowercase untuk matching
  const sumber = `${providerSeluler ?? ""} ${namaProduk ?? ""}`.toLowerCase();

  // Urutan prioritas: by.U dulu (karena "byu" bisa match "byu" di kata lain)
  if (/\bbyu\b|\bby\.u\b/.test(sumber)) return "telkomsel"; // by.U adalah sub-brand Telkomsel
  if (/\btelkomsel\b|\bsimpati\b|\bas\b/.test(sumber)) return "telkomsel";
  if (/\baxis\b|\baigo\b/.test(sumber)) return "axis"; // AIGO = produk Axis
  if (/\btri\b|\bthree\b|\b 3 \b/.test(sumber)) return "tri";
  if (/\bxl\b|\baxiata\b/.test(sumber)) return "xl";
  if (/\bindosat\b|\bim3\b|\bmentari\b/.test(sumber)) return "indosat";
  if (/\bsmartfren\b|\bfren\b/.test(sumber)) return "smartfren";
  if (/\bpln\b|\btoken listrik\b/.test(sumber)) return "pln";
  if (/\bdana\b/.test(sumber)) return "dana";
  if (/\bgopay\b|\bgo-pay\b/.test(sumber)) return "gopay";
  if (/\bovo\b/.test(sumber)) return "ovo";
  if (/\bshopeepay\b|\bshopee pay\b/.test(sumber)) return "shopeepay";

  return "unknown";
}

/**
 * Ambil path logo brand berdasarkan nama produk DAN jenis transaksi.
 *
 * ATURAN:
 * - Untuk pulsa/paket_data/paket_nelpon: deteksi operator dari providerSeluler + namaProduk
 * - Untuk jenis lain: keyword matching dari namaProduk (logic lama)
 * - Fallback: generic-sim.svg untuk operator tidak dikenal
 *
 * @param namaProduk - Nama produk dari transaksi (bisa null untuk pulsa)
 * @param jenisTransaksi - Jenis transaksi (pulsa, paket_nelpon, dll)
 * @param providerSeluler - Operator seluler eksplisit (dari field transaksi)
 * @returns Path ke file SVG logo, atau null kalau tidak match
 */
export function getBrandLogo(
  namaProduk: string | null | undefined,
  jenisTransaksi: string,
  providerSeluler?: string | null,
): string | null {
  const jt = jenisTransaksi.toLowerCase();

  // Untuk jenis yang terkait operator seluler: gunakan deteksi operator
  if (
    jt === "pulsa" ||
    jt === "paket_data" ||
    jt === "paket_nelpon" ||
    jt === "data"
  ) {
    const operator = deteksiOperatorSeluler(providerSeluler, namaProduk);
    return OPERATOR_LOGO_MAP[operator];
  }

  // Untuk jenis lain: gunakan keyword matching dari namaProduk (logic lama)
  if (!namaProduk) return null;

  const lower = namaProduk.toLowerCase();
  const match = BRAND_KEYWORDS.find((b) =>
    b.keywords.some((kw) => lower.includes(kw.toLowerCase())),
  );

  return match?.logoPath ?? null;
}
