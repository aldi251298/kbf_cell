"use client";

import { cn } from "@/lib/utils";
import { getIconJenisTransaksi } from "@/lib/config/iconJenisTransaksi";

interface IkonJenisTransaksiProps {
  jenis: string | undefined | null;
  className?: string;
  size?: number; // default 32px
}

/**
 * Badge bulat berwarna menampilkan icon Lucide sesuai jenis transaksi.
 * Background menggunakan warna kategori dengan opacity 15% (design token),
 * icon menggunakan warna penuh kategori.
 * Hover effect: subtle scale + shadow elevation.
 */
export function IkonJenisTransaksi({
  jenis,
  className,
  size = 32,
}: IkonJenisTransaksiProps) {
  const { icon: Icon, warna } = getIconJenisTransaksi(jenis);

  // Extract HSL values from warna (e.g., "hsl(var(--success))" -> "var(--success)")
  const warnaVar = warna.replace("hsl(", "").replace(")", "");

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full shrink-0",
        "border border-border/50 shadow-sm",
        "transition-all duration-200",
        "hover:shadow-md hover:border-border/70 hover:scale-[1.02]",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: `hsl(${warnaVar} / 0.15)`,
        borderColor: `hsl(${warnaVar} / 0.3)`,
      }}
      aria-label={`Ikon ${jenis}`}
    >
      <Icon
        className="shrink-0"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          color: warna,
        }}
        aria-hidden="true"
      />
    </div>
  );
}
