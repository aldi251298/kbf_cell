/**
 * extractStatus � extract status from notification text (Bagian 3.6).
 * Priority: first match wins.
 * Default: "pending" + perlu_review=true if nothing found.
 */

import { STATUS_KEYWORDS } from "./keywords";

export function extractStatus(text: string): "sukses" | "gagal" | "pending" {
  const lower = text.toLowerCase();

  for (const [status, keywords] of Object.entries(STATUS_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return status as "sukses" | "gagal" | "pending";
      }
    }
  }

  return "pending";
}