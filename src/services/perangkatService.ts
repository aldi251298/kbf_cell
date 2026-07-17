/**
 * Perangkat Service Layer
 *
 * TODO [BACKEND INTEGRATION]: Replace fake data calls with actual API endpoints:
 * - GET    /api/perangkat        -> fetch all devices
 * - GET    /api/perangkat/:id    -> fetch single device
 * - GET    /api/perangkat/:id/history -> fetch device status history
 * - WS     /api/perangkat/realtime -> WebSocket for real-time status updates
 *
 * Current implementation uses fake data generator from 'src/data/perangkatData'
 */

import { PERANGKAT_LIST } from "@/data/perangkatData";
import { getRiwayatStatusPerangkat } from "@/data/perangkatData";
import { KONTER_LIST } from "@/data/konterData";
import type { Perangkat, RiwayatStatusPerangkat, Konter } from "@/types";

/**
 * Get all device statuses
 * @returns Promise<Perangkat[]>
 */
export async function getPerangkat(): Promise<Perangkat[]> {
  // TODO [BACKEND INTEGRATION]: Replace with:
  // const response = await fetch('/api/perangkat');
  // return response.json();

  // Simulate slight delay for realistic feel
  await new Promise((resolve) => setTimeout(resolve, 200));

  return [...PERANGKAT_LIST]; // Return copy to prevent mutation
}

/**
 * Get device status by ID
 * @param id - Device ID
 * @returns Promise<Perangkat | undefined>
 */
export async function getPerangkatById(
  id: string,
): Promise<Perangkat | undefined> {
  // TODO [BACKEND INTEGRATION]: Replace with:
  // const response = await fetch(`/api/perangkat/${id}`);
  // return response.json();

  await new Promise((resolve) => setTimeout(resolve, 150));

  return PERANGKAT_LIST.find((p) => p.id === id);
}

/**
 * Get device status history
 * @param konterId - Counter/Device ID
 * @param days - Number of days of history (default: 7)
 * @returns Promise<RiwayatStatusPerangkat>
 */
export async function getPerangkatHistory(
  konterId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _days: number = 7,
): Promise<RiwayatStatusPerangkat> {
  // TODO [BACKEND INTEGRATION]: Replace with:
  // const response = await fetch(`/api/perangkat/${konterId}/history?days=${days}`);
  // return response.json();

  await new Promise((resolve) => setTimeout(resolve, 250));

  return getRiwayatStatusPerangkat(konterId);
}

/**
 * Simulate real-time device status check
 * TODO [BACKEND INTEGRATION]: Replace with WebSocket subscription:
 * const ws = new WebSocket('/api/perangkat/realtime');
 * ws.onmessage = (event) => {
 *   const data = JSON.parse(event.data);
 *   updateDeviceStatus(data);
 * };
 *
 * @param callback - Function to call with updated status
 * @returns Cleanup function to unsubscribe
 */
export function subscribePerangkatStatus(
  callback: (status: Perangkat[]) => void,
): () => void {
  // TODO [BACKEND INTEGRATION]: Replace with WebSocket subscription

  // For now, just call callback once with current data
  getPerangkat().then(callback);

  // Return cleanup function (no-op for now)
  return () => {
    // TODO [BACKEND INTEGRATION]: Close WebSocket connection
    console.log("Cleanup: WebSocket subscription removed");
  };
}

/**
 * Get all counter (konter) list
 * @returns Promise<Konter[]>
 */
export async function getKonterList(): Promise<Konter[]> {
  // TODO [BACKEND INTEGRATION]: Replace with:
  // const response = await fetch('/api/konter');
  // return response.json();

  await new Promise((resolve) => setTimeout(resolve, 100));
  return [...KONTER_LIST]; // Return copy to prevent mutation
}
