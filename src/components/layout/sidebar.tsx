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
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserProfile } from "@/lib/useUserProfile";

const MENU_ITEMS = [
  { label: "Dashboard", icon: HomeIcon, href: "/", adminOnly: false },
  {
    label: "Tambah Transaksi Manual",
    icon: PlusCircleIcon,
    href: "/transaksi-baru",
    adminOnly: false,
  },
  {
    label: "Riwayat Transaksi",
    icon: HistoryIcon,
    href: "/transaksi",
    adminOnly: false,
  },
  {
    label: "Pending & Gagal",
    icon: AlertTriangleIcon,
    href: "/transaksi-pending",
    adminOnly: false,
  },
  { label: "Laporan", icon: BarChartIcon, href: "/laporan", adminOnly: true },
  {
    label: "Perangkat",
    icon: SmartphoneIcon,
    href: "/perangkat",
    adminOnly: true,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { profile, loading } = useUserProfile();

  return (
    <>
      {/* Overlay - only visible on mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "w-[270px] bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
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
          {!loading &&
            MENU_ITEMS.map((item) => {
              // Hide admin-only items for operators
              if (item.adminOnly && profile?.role === "operator") {
                return null;
              }
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
                  onClick={onClose}
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

        {/* Close button - only visible on mobile */}
        <button
          type="button"
          className="lg:hidden absolute bottom-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          onClick={onClose}
          aria-label="Tutup menu"
        >
          <X className="h-6 w-6" strokeWidth={2} />
        </button>
      </aside>
    </>
  );
}
