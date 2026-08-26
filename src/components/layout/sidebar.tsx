"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Monitor,
  ReceiptText,
  Plus,
  Minimize2,
  Maximize2,
  AlertTriangle,
  Terminal,
  ChartNoAxesColumn,
} from "lucide-react";
import { NavItem } from "./nav-item";
import { useState } from "react";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transaksi-baru", icon: Plus, label: "Tambah Transaksi Manual" },
  { href: "/transaksi", icon: ReceiptText, label: "Riwayat Transaksi" },
  { href: "/transaksi-pending", icon: AlertTriangle, label: "Pending & Gagal" },
  { href: "/laporan", icon: ChartNoAxesColumn, label: "Laporan" },
  { href: "/perangkat", icon: Monitor, label: "Perangkat" },
  { href: "/simulator", icon: Terminal, label: "Transaction Simulator" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col transition-all duration-300",
        "fixed top-0 left-0 h-full z-30",
        "bg-white",
        "border-r border-border-subtle",
        collapsed ? "w-40" : "w-57.5",
      )}
    >
      {/* Logo / Brand */}
      <div
        className={cn(
          "flex items-center border-b px-5 py-4.5",
          "border-border-subtle",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-25 w-35 shrink-0 items-center justify-center overflow-hidden">
              <Image
                src="/logo_kbf.png"
                alt="KBF Cell Logo"
                width={90}
                height={80}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex h-16 w-18 items-center justify-center">
            <Image
              src="/logo_kbf.png"
              alt="KBF Cell Logo"
              width={90}
              height={68}
              className="h-full w-full object-contain"
            />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto hidden rounded-lg p-1.5 text-text-tertiary hover:bg-surface-hover hover:text-text-secondary lg:block transition-colors duration-150"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <Maximize2 className="h-4 w-4" strokeWidth={2} />
          ) : (
            <Minimize2 className="h-4 w-4" strokeWidth={2} />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isCollapsed={collapsed}
          />
        ))}
      </nav>

      {/* Bottom Section - User/Version Info */}
      <div className="border-t border-border-subtle p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-secondary border border-border-subtle">
            <div className="h-8 w-8 rounded-lg bg-white border border-border-subtle overflow-hidden flex items-center justify-center">
              <Image
                src="/logo_kbf.png"
                alt="KBF Cell Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                Dashboard Admin
              </p>
              <p className="text-[10px] text-text-tertiary">v1.1.0</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
