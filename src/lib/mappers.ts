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
    paket_data: "data",
    pln: "ppob",
    ewallet_dana: "ewallet",
    voucher: "voucher",
    pulsa_op: "pulsa",
    ewallet: "ewallet",
    ppob: "ppob",
    data: "data",
    p2p: "p2p",
    gametopup: "gametopup",
    keuangan: "keuangan",
    belum_dikenal: "pulsa",
  };

  const jenis = row.jenis_transaksi;
  const kategori = kategoriMap[jenis] ?? "pulsa";

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
      return "Isi Ulang Pulsa";
    case "paket_data":
      return "Paket Data";
    case "pln":
      return "PLN Prabayar";
    case "ewallet_dana":
      return "Top Up DANA";
    case "voucher":
      return "Voucher";
    case "pulsa_op":
      return "Pulsa Operator";
    case "ewallet":
      return "E-Wallet";
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
    default:
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
