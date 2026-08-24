"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Transaksi } from "@/types";

/**
 * useTransaksiRealtime
 *
 * Subscribes to Supabase Realtime INSERT events on the `transaksi` table and
 * invokes the callback whenever a new transaction arrives. The subscription is
 * cleaned up on unmount to prevent memory leaks / stacked subscriptions.
 *
 * Decision (SRS Bagian 7): the callback receives every new transaction; the
 * consuming component decides whether to display it based on active filters.
 * This keeps the hook generic and avoids stale-filter bugs.
 */
export function useTransaksiRealtime(
  onNewTransaksi: (trx: Transaksi) => void,
  enabled: boolean = true,
) {
  const callbackRef = useRef(onNewTransaksi);

  useEffect(() => {
    callbackRef.current = onNewTransaksi;
  }, [onNewTransaksi]);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    const channel = supabase
      .channel("transaksi-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transaksi" },
        (payload) => {
          // Map the raw row to the domain Transaksi type inline (lightweight).
          const row = payload.new as Record<string, unknown>;
          const trx: Transaksi = {
            id: row.id as string,
            waktu: new Date(row.waktu as string),
            konterId: row.konter_id as string,
            konterNama: row.konter_nama as string,
            nomorTujuan: (row.nomor_tujuan as string) ?? "",
            produk: {
              nama: row.produk_nama as string,
              kategori: row.produk_kategori as Transaksi["produk"]["kategori"],
              nominal: Number(row.produk_nominal),
            },
            nominal: Number(row.nominal),
            status: row.status as Transaksi["status"],
            sn: (row.sn as string) ?? "",
            errorMessage: (row.error_message as string) ?? undefined,
            provider: row.provider as string,
            detail: row.detail_tambahan as Transaksi["detail"],
          };
          callbackRef.current(trx);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled]);
}
