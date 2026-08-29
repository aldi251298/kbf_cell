/**
 * Perangkat Service Layer
 *
 * Phase 2: implementation now fetches real data from the /api/perangkat and
 * /api/konter routes (which read from Supabase). Signatures preserved.
 */

import type { Perangkat, RiwayatStatusPerangkat, Konter } from "@/types";
import { apiFetch } from "@/lib/api-client";

/**
 * Get all device statuses.
 */
export async function getPerangkat(): Promise<Perangkat[]> {
  const res = await apiFetch("/api/perangkat");
  if (!res.ok) throw new Error("Gagal mengambil data perangkat.");
  return res.json();
}

/**
 * Get device status by ID.
 */
export async function getPerangkatById(
  id: string,
): Promise<Perangkat | undefined> {
  const all = await getPerangkat();
  return all.find((p) => p.id === id);
}

/**
 * Get device status history.
 * @param konterId - Counter/Device ID
 * @param days - Number of days of history (default: 7)
 */
export async function getPerangkatHistory(
  konterId: string,
  days: number = 7,
): Promise<RiwayatStatusPerangkat> {
  const res = await apiFetch(`/api/perangkat/${konterId}/history?days=${days}`);
  if (!res.ok) throw new Error("Gagal mengambil riwayat perangkat.");
  return res.json();
}

/**
 * Subscribe to real-time device status updates via Supabase Realtime.
 *
 * The callback is invoked with the full device list whenever a perangkat row
 * changes (e.g. heartbeat update). The returned cleanup function removes the
 * subscription to prevent memory leaks on unmount.
 *
 * Decision: new transactions/devices that don't match the current view are
 * still pushed — the callback receives the full list and the UI decides what
 * to render. This keeps the subscription simple and avoids stale filters.
 */
export function subscribePerangkatStatus(
  callback: (status: Perangkat[]) => void,
): () => void {
  let supabase: ReturnType<
    typeof import("@/lib/supabase/client").createClient
  > | null = null;
  let channel: unknown = null;
  let cancelled = false;

  (async () => {
    const { createClient } = await import("@/lib/supabase/client");
    supabase = createClient();

    // Initial fetch
    const initial = await getPerangkat();
    if (!cancelled) callback(initial);

    // Subscribe to perangkat table changes
    channel = supabase
      .channel("perangkat-status")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "perangkat" },
        async () => {
          if (cancelled) return;
          const updated = await getPerangkat();
          callback(updated);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "device_heartbeat" },
        async () => {
          if (cancelled) return;
          const updated = await getPerangkat();
          callback(updated);
        },
      )
      .subscribe();
  })();

  return () => {
    cancelled = true;
    if (channel && supabase) {
      supabase.removeChannel(
        channel as Parameters<typeof supabase.removeChannel>[0],
      );
    }
  };
}

/**
 * Get all counter (konter) list.
 */
export async function getKonterList(): Promise<Konter[]> {
  const res = await apiFetch("/api/konter");
  if (!res.ok) throw new Error("Gagal mengambil data konter.");
  return res.json();
}
