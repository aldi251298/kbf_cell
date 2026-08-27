"use client";

import { cn } from "@/lib/utils";
import {
  HomeIcon,
  PlusCircleIcon,
  HistoryIcon,
  AlertTriangleIcon,
  BarChartIcon,
  SmartphoneIcon,
  ShieldCheckIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU_ITEMS = [
  { label: "Dashboard", icon: HomeIcon, href: "/" },
  {
    label: "Tambah Transaksi Manual",
    icon: PlusCircleIcon,
    href: "/transaksi-baru",
  },
  { label: "Riwayat Transaksi", icon: HistoryIcon, href: "/transaksi" },
  {
    label: "Pending & Gagal",
    icon: AlertTriangleIcon,
    href: "/transaksi-pending",
  },
  { label: "Laporan", icon: BarChartIcon, href: "/laporan" },
  { label: "Perangkat", icon: SmartphoneIcon, href: "/perangkat" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[270px] bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0 z-30">
      {/* Brand */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-lg">
          K
        </div>
        <div>
          <p className="font-bold leading-tight">KBF CELL</p>
          <p className="text-xs text-slate-400">Dashboard Monitoring</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {MENU_ITEMS.map((item) => {
          const aktif =
            pathname === item.href ||
            (item.href !== "/" && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors",
                aktif
                  ? "bg-blue-600 text-white font-medium"
                  : "text-slate-300 hover:bg-slate-800",
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Security footer */}
      <div className="p-4 m-4 bg-slate-800 rounded-xl flex items-center gap-3">
        <ShieldCheckIcon className="text-emerald-400 shrink-0" size={20} />
        <div>
          <p className="text-sm font-medium">Sistem Aman</p>
          <p className="text-xs text-slate-400">Data terenkripsi & aman</p>
        </div>
      </div>
    </aside>
  );
}
