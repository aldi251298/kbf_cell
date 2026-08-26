"use client";

import { cn } from "@/lib/utils";
import { getBrandLogo } from "@/lib/config/brandLogo";
import { Store } from "lucide-react";
import Image from "next/image";

interface LogoBrandProps {
  namaProduk: string | null | undefined;
  jenisTransaksi: string;
  className?: string;
  size?: number; // default 32px
}

/**
 * Badge bulat kecil menampilkan logo brand SVG.
 * Kalau logo tidak ditemukan (getBrandLogo return null), fallback ke icon Store dari Lucide.
 * Border/shadow halus mengikuti design token.
 * Hover effect: subtle scale + shadow elevation.
 */
export function LogoBrand({
  namaProduk,
  jenisTransaksi,
  className,
  size = 30,
}: LogoBrandProps) {
  const logoPath = getBrandLogo(namaProduk, jenisTransaksi);

  if (logoPath) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-full shrink-0 overflow-hidden",
          "transition-all duration-200",
          "hover:shadow-md hover:border-border/70 hover:scale-[1.02]",
          className,
        )}
        style={{
          width: size,
          height: size,
          backgroundColor: `hsl(var(--card))`,
          borderColor: `hsl(var(--border))`,
        }}
        aria-label={`Logo ${namaProduk ?? jenisTransaksi}`}
      >
        <Image
          src={logoPath}
          alt=""
          width={size * 0.78}
          height={size * 0.78}
          style={{ objectFit: "contain" }}
          aria-hidden="true"
        />
      </div>
    );
  }

  // Fallback: icon Store generik
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
        backgroundColor: `hsl(var(--muted))`,
        borderColor: `hsl(var(--border))`,
      }}
      aria-label="Brand tidak dikenali"
    >
      <Store
        className="shrink-0 text-text-tertiary"
        style={{
          width: size * 0.5,
          height: size * 0.5,
        }}
        aria-hidden="true"
      />
    </div>
  );
}
