/**
 * extractProviderSeluler — detect mobile provider from notification text (Bagian 3.8a).
 * Uses keyword matching first, falls back to phone number prefix analysis.
 */

import { PROVIDER_SELULER_KEYWORDS, PROVIDER_SELULER_PREFIXES } from "./keywords";

export function extractProviderSeluler(
  text: string,
  nomorTujuan: string | null,
): string | null {
  const lower = text.toLowerCase();

  // 1. Keyword matching
  for (const [provider, keywords] of Object.entries(PROVIDER_SELULER_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return provider;
      }
    }
  }

  // 2. Prefix fallback from nomor_tujuan
  if (nomorTujuan) {
    const clean = nomorTujuan.replace(/^\+?62/, "0"); // normalize to 0xxx format

    for (const [provider, prefixes] of Object.entries(PROVIDER_SELULER_PREFIXES)) {
      for (const prefix of prefixes) {
        if (clean.startsWith(prefix)) {
          return provider;
        }
      }
    }
  }

  return null;
}