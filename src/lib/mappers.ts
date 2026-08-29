import type {
  KonterRow,
  PerangkatRow,
  TransaksiRow,
  DeviceHeartbeatRow,
} from "@/types/database";
import type {
  Konter,
  Perangkat,
  Transaksi,
  RiwayatStatusPerangkat,
  StatusOnline,
  KategoriTransaksi,
} from "@/types";
import { computeDeviceStatus } from "@/lib/constants";

/** Map a `konter` row to the domain `Konter` type. */
export function mapKonter(row: KonterRow): Konter {
  return {
    id: row.id,
    nama: row.nama,
    lokasi: row.lokasi ?? undefined,
    perangkatId: row.perangkat_id,
  };
}

/** Map a `perangkat` row to the domain `Perangkat` type (computes status). */
export function mapPerangkat(row: PerangkatRow): Perangkat {
  const lastHeartbeat = row.last_heartbeat
    ? new Date(row.last_heartbeat)
    : new Date(0);
  return {
    id: row.id,
    nama: row.nama,
    konterId: row.konter_id,
    status: row.last_heartbeat
      ? computeDeviceStatus(row.last_heartbeat)
      : "offline",
    lastHeartbeat,
    ip: row.ip ?? undefined,
    userAgent: row.user_agent ?? undefined,
    lokasi: row.lokasi ?? undefined,
  };
}

/** Map a `transaksi` row to the domain `Transaksi` type. */
export function mapTransaksi(row: TransaksiRow): Transaksi {
  const kategoriMap: Record<string, KategoriTransaksi> = {
    pulsa: "pulsa",
    paket_nelpon: "paket_nelpon",
    paket_data: "paket_data",
    pln: "pln",
    ewallet_dana: "ewallet",
    voucher: "voucher",
    voucher_fisik: "voucher_fisik",
    voucher_data_alpines: "voucher_data_alpines",
    pulsa_op: "pulsa",
    ewallet: "ewallet",
    game_topup: "game_topup",
    wifi: "wifi",
    tv_kabel: "tv_kabel",
    pdam: "pdam",
    token_listrik_reseller: "token_listrik_reseller",
    data: "paket_data",
    p2p: "p2p",
    ppob: "pln",
    gametopup: "game_topup",
    keuangan: "keuangan",
    belum_dikenal: "belum_dikenal",
    aksesoris: "aksesoris",
  };

  const jenis = row.jenis_transaksi;
  const kategori =
    kategoriMap[jenis] ??
    (jenis.startsWith("lainnya_") ? jenis : "belum_dikenal");

  return {
    id: row.id,
    waktu: new Date(row.waktu),
    konterId: row.konter_id,
    konterNama: row.konter?.nama ?? row.konter_nama,
    nomorTujuan: row.nomor_tujuan ?? "",
    produk: {
      nama: row.nama_produk ?? getDefaultProdukNama(jenis),
      kategori,
      nominal: row.nominal ?? 0,
    },
    nominal: row.nominal ?? 0,
    status: row.status,
    sn: row.sn ?? "",
    providerSeluler: row.provider_seluler ?? undefined,
    namaPemilik: row.nama_pemilik ?? undefined,
    perluReview: row.perlu_review ?? undefined,
    detail: row.detail_tambahan
      ? {
          nomorTujuan: row.nomor_tujuan ?? undefined,
          platform: row.provider === "alpines" ? "alpines" : undefined,
          namaProduk: row.nama_produk ?? undefined,
        }
      : undefined,
    errorMessage: row.perlu_review
      ? "Transaksi perlu review manual"
      : undefined,
  };
}

function getDefaultProdukNama(jenis: string): string {
  switch (jenis) {
    case "pulsa":
      return "Pulsa";
    case "paket_nelpon":
      return "Paket Nelpon/SMS";
    case "paket_data":
      return "Paket Data";
    case "pln":
      return "PLN Prabayar";
    case "ewallet_dana":
      return "Top Up DANA";
    case "voucher":
      return "Voucher";
    case "voucher_fisik":
      return "Voucher Fisik Internet";
    case "voucher_data_alpines":
      return "Voucher Data";
    case "pulsa_op":
      return "Pulsa Operator";
    case "ewallet":
      return "E-Wallet";
    case "game_topup":
      return "Top Up Game";
    case "wifi":
      return "Internet/WiFi";
    case "tv_kabel":
      return "TV Kabel";
    case "pdam":
      return "PDAM/Air";
    case "token_listrik_reseller":
      return "Token Listrik Reseller";
    case "ppob":
      return "PPOB";
    case "data":
      return "Paket Data";
    case "p2p":
      return "Transfer P2P";
    case "gametopup":
      return "Top Up Game";
    case "keuangan":
      return "Keuangan";
    case "belum_dikenal":
      return "Transaksi (Perlu Review)";
    case "aksesoris":
      return "Aksesoris";
    default:
      if (jenis.startsWith("lainnya_")) {
        // Format: "lainnya_wifi" -> "Wifi"
        const label = jenis.replace("lainnya_", "").replace(/_/g, " ");
        return label.charAt(0).toUpperCase() + label.slice(1);
      }
      return "Transaksi";
  }
}

/** Map `device_heartbeat` rows to the domain `RiwayatStatusPerangkat` type. */
export function mapRiwayatStatus(
  konterId: string,
  rows: DeviceHeartbeatRow[],
): RiwayatStatusPerangkat {
  return {
    konterId,
    catatan: rows.map((r) => ({
      waktu: new Date(r.recorded_at),
      status: r.status as StatusOnline,
      durasiMenit: r.duration_minutes ?? 0,
    })),
  };
}
