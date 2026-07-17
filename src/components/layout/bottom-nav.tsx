"use client";

import { cn } from "@/lib/utils";
import { BarChart3, LayoutDashboard, Monitor, Receipt } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Ringkasan" },
  { href: "/transaksi", icon: Receipt, label: "Transaksi" },
  { href: "/laporan", icon: BarChart3, label: "Laporan" },
  { href: "/perangkat", icon: Monitor, label: "Perangkat" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-150",
                isActive
                  ? "text-accent bg-accent/10"
                  : "text-text-tertiary hover:text-text-secondary hover:bg-surface-hover",
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-accent")} />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isActive && "font-semibold",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
