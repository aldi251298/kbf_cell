/**
 * Konfigurasi Logo Brand â€” mapping keyword â†’ path file SVG asli di public/assets/brands/
 * NAMA FILE HARUS SAMA PERSIS (case-sensitive) dengan file di folder brands.
 * Jangan buat entry untuk brand yang SVG-nya belum tersedia.
 */

const BRAND_KEYWORDS: { keywords: string[]; logoPath: string }[] = [
  // Telkomsel & sub-brand (by.U, Kaget, OMG, Talkmania)
  {
    keywords: ["telkomsel", "byu", "by.u", "kaget", "omg", "talkmania"],
    logoPath: "/assets/brands/Telkomsel.svg",
  },
  // AXIS
  {
    keywords: ["axis"],
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
  // by.U (sudah di-cover di Telkomsel, tapi bisa ditambahkan eksplisit kalau perlu)
  // LinkAja, XL, Smartfren â€” BELUM ADA SVG, jadi tidak dibuat entry-nya
];

/**
 * Ambil path logo brand berdasarkan nama produk DAN jenis transaksi.
 *
 * ATURAN KHUSUS:
 * - Pulsa (jenis_transaksi === "pulsa") SELALU pakai logo Telkomsel,
 *   karena Digipos di konter ini eksklusif Telkomsel.
 * - Paket Nelpon (Talkmania) juga produk Telkomsel, sudah di-cover via keyword "talkmania".
 *
 * @param namaProduk - Nama produk dari transaksi (bisa null untuk pulsa)
 * @param jenisTransaksi - Jenis transaksi (pulsa, paket_nelpon, dll)
 * @returns Path ke file SVG logo, atau null kalau tidak match
 */
export function getBrandLogo(
  namaProduk: string | null | undefined,
  jenisTransaksi: string,
): string | null {
  // ATURAN KHUSUS: Pulsa Digipos SELALU Telkomsel
  if (jenisTransaksi === "pulsa") {
    return "/assets/brands/Telkomsel.svg";
  }

  if (!namaProduk) return null;

  const lower = namaProduk.toLowerCase();
  const match = BRAND_KEYWORDS.find((b) =>
    b.keywords.some((kw) => lower.includes(kw.toLowerCase())),
  );

  return match?.logoPath ?? null;
}
