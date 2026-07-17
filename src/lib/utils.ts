import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Helper
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency (Rupiah)
export function formatRupiah(angka: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka);
}

// Format number with Indonesian locale
export function formatAngka(nilai: number): string {
  return new Intl.NumberFormat("id-ID").format(nilai);
}

// Format percentage
export function formatPersen(nilai: number): string {
  const sign = nilai >= 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(nilai)}%`;
}

// Format date/time
export function formatWaktu(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
}

// Format time only
export function formatJam(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// Format date only
export function formatTanggal(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

// Format phone number
export function formatNomorTelepon(nomor: string): string {
  // Format: 0812-3456-7890 or 62812-3456-7890
  const cleaned = nomor.replace(/\D/g, "");
  if (cleaned.startsWith("62")) {
    return `62${cleaned.slice(2).replace(/(\d{4})(?=\d)/g, "$1-")}`;
  }
  return `0${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}`;
}

// Format duration (milliseconds to human readable)
export function formatDurasi(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} hari ${hours % 24} jam`;
  if (hours > 0) return `${hours} jam ${minutes % 60} menit`;
  if (minutes > 0) return `${minutes} menit ${seconds % 60} detik`;
  return `${seconds} detik`;
}

// Format large numbers (e.g., 1500000 -> "1,5 Juta")
export function formatAngkaSingkat(nilai: number): string {
  if (nilai >= 1000000000) {
    return `${(nilai / 1000000000).toFixed(1)}M`;
  }
  if (nilai >= 1000000) {
    return `${(nilai / 1000000).toFixed(1)}Jt`;
  }
  if (nilai >= 1000) {
    return `${(nilai / 1000).toFixed(1)}Rb`;
  }
  return nilai.toString();
}

// Calculate percentage change
export function hitungPerubahanPersen(baru: number, lama: number): number {
  if (lama === 0) return 0;
  return ((baru - lama) / lama) * 100;
}

// Generate random SN (serial number)
export function generateSN(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "TRX-";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Truncate string
export function potongTeks(teks: string, maxLength: number): string {
  if (teks.length <= maxLength) return teks;
  return teks.slice(0, maxLength) + "...";
}

// Get relative time description
export function waktuLalu(date: Date | string): string {
  const now = new Date();
  const target = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - target.getTime();
  const diffMenit = Math.floor(diffMs / 60000);
  const jam = Math.floor(diffMenit / 60);
  const hari = Math.floor(jam / 24);

  if (hari > 0) return `${hari} hari lalu`;
  if (jam > 0) return `${jam} jam lalu`;
  if (diffMenit > 0) return `${diffMenit} menit lalu`;
  return "Baru saja";
}
