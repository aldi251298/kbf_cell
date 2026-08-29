import {
  Smartphone,
  Wifi,
  WalletCards,
  Zap,
  Gamepad2,
  ReceiptText,
  ArrowLeftRight,
  Coins,
  PhoneCall,
  HelpCircle,
  Tv,
  Droplet,
  Waves,
  CreditCard as CreditCardIcon,
  Smartphone as SmartphoneIcon,
  Package,
  LucideIcon,
} from "lucide-react";

/**
 * Mapping jenis_transaksi â†’ icon Lucide + warna (menggunakan design token dari globals.css)
 * Warna menggunakan HSL values dari design token: --success, --warning, --error, --accent, --card-revenue, --card-transactions, dll.
 */
export const ICON_JENIS_TRANSAKSI: Record<
  string,
  { icon: LucideIcon; warna: string }
> = {
  // Pulsa reguler â€” Smartphone, warna Success (hijau)
  pulsa: { icon: Smartphone, warna: "hsl(var(--success))" },

  // Paket Nelpon / Talkmania â€” PhoneCall, warna Warning (amber) supaya beda dari pulsa
  paket_nelpon: { icon: PhoneCall, warna: "hsl(var(--warning))" },

  // Paket Data â€” Wifi, warna Accent (biru)
  paket_data: { icon: Wifi, warna: "hsl(var(--accent))" },

  // Voucher Data Alpines â€” Wifi, warna Accent muted
  voucher_data_alpines: { icon: Wifi, warna: "hsl(var(--accent-muted))" },

  // PLN / Token Listrik â€” Zap, warna Error (merah)
  pln: { icon: Zap, warna: "hsl(var(--error))" },
  token_listrik_reseller: { icon: Zap, warna: "hsl(var(--error))" },

  // E-Wallet â€” WalletCards, warna Card Revenue (violet/purple)
  ewallet: { icon: WalletCards, warna: "hsl(var(--card-revenue))" },
  ewallet_dana: { icon: WalletCards, warna: "hsl(var(--card-revenue))" },

  // Voucher â€” ReceiptText, warna Secondary
  voucher: { icon: ReceiptText, warna: "hsl(var(--secondary))" },

  // Voucher Fisik Internet â€” CreditCard, warna Card Balance (blue/indigo)
  voucher_fisik: { icon: CreditCardIcon, warna: "hsl(var(--card-balance))" },

  // Game Top Up â€” Gamepad2, warna Card Transactions (amber/orange)
  game_topup: { icon: Gamepad2, warna: "hsl(var(--card-transactions))" },
  gametopup: { icon: Gamepad2, warna: "hsl(var(--card-transactions))" },

  // WiFi / Internet Rumah â€” Waves, warna Info (biru)
  wifi: { icon: Waves, warna: "hsl(var(--info))" },

  // TV Kabel â€” Tv, warna Card Revenue (violet)
  tv_kabel: { icon: Tv, warna: "hsl(var(--card-revenue))" },

  // PDAM / Air â€” Droplet, warna Success (hijau)
  pdam: { icon: Droplet, warna: "hsl(var(--success))" },

  // Pulsa Operator â€” Smartphone, warna Accent
  pulsa_op: { icon: SmartphoneIcon, warna: "hsl(var(--accent))" },

  // PPOB â€” ReceiptText, warna Secondary
  ppob: { icon: ReceiptText, warna: "hsl(var(--secondary))" },

  // Transfer P2P â€” ArrowLeftRight, warna Card Income (emerald/teal)
  p2p: { icon: ArrowLeftRight, warna: "hsl(var(--card-income))" },

  // Keuangan â€” Coins, warna Card Balance
  keuangan: { icon: Coins, warna: "hsl(var(--card-balance))" },

  // Data (alias paket_data) â€” Wifi, warna Accent
  data: { icon: Wifi, warna: "hsl(var(--accent))" },

  // Aksesoris â€” Package, warna Card Balance (indigo)
  aksesoris: { icon: Package, warna: "hsl(var(--card-balance))" },

  // Fallback untuk jenis yang belum dikenali
  belum_dikenal: { icon: HelpCircle, warna: "hsl(var(--muted-foreground))" },
};

/**
 * Ambil icon & warna untuk jenis transaksi.
 * Fallback ke HelpCircle + muted foreground kalau tidak ditemukan.
 */
export function getIconJenisTransaksi(
  jenisTransaksi: string | undefined | null,
): {
  icon: LucideIcon;
  warna: string;
} {
  // Defensive: handle null/undefined jenisTransaksi
  const key = jenisTransaksi?.toLowerCase() ?? "";
  return ICON_JENIS_TRANSAKSI[key] ?? ICON_JENIS_TRANSAKSI.belum_dikenal;
}
