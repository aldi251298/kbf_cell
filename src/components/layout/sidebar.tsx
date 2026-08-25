"use client";

import { cn } from "@/lib/utils";
import {
  BarChart3,
  LayoutDashboard,
  Monitor,
  Receipt,
  Plus,
  Minimize2,
  Maximize2,
  AlertTriangle,
  Terminal,
} from "lucide-react";
import { NavItem } from "./nav-item";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transaksi-baru", icon: Plus, label: "Transaksi Baru" },
  { href: "/transaksi", icon: Receipt, label: "Riwayat Transaksi" },
  { href: "/transaksi-pending", icon: AlertTriangle, label: "Pending & Gagal" },
  { href: "/laporan", icon: BarChart3, label: "Laporan" },
  { href: "/perangkat", icon: Monitor, label: "Perangkat" },
  { href: "/simulator", icon: Terminal, label: "Transaction Simulator" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r transition-all duration-300",
        "fixed top-0 left-0 h-full z-30",
        "bg-white",
        "border-gray-100",
        collapsed ? "w-20" : "w-64",
      )}
    >
      {/* Logo / Brand */}
      <div
        className={cn(
          "flex items-center border-b p-4",
          "border-gray-100",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-none bg-gradient-to-br from-blue-600 to-blue-800 shadow-sm shadow-blue-600/20">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-gray-900 tracking-tight">
                KBF Cell
              </span>
              <p className="text-[10px] font-medium text-gray-500 leading-none mt-0.5">
                Dashboard
              </p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex h-9 w-9 items-center justify-center rounded-none bg-gradient-to-br from-blue-600 to-blue-800 shadow-sm shadow-blue-600/20">
            <Receipt className="h-5 w-5 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto hidden rounded-none p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 lg:block transition-colors duration-150"
        >
          {collapsed ? (
            <Maximize2 className="h-4 w-4" />
          ) : (
            <Minimize2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
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
      <div className="border-t border-gray-100 p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-none bg-gray-50 border border-gray-100">
            <div className="h-8 w-8 rounded-none bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-sm shadow-blue-600/20">
              <span className="text-xs font-bold text-white">KC</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Konter Admin
              </p>
              <p className="text-[10px] text-gray-500">v2.7.0</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
