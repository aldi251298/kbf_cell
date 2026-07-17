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
} from "lucide-react";
import { NavItem } from "./nav-item";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transaksi-baru", icon: Plus, label: "Transaksi Baru" },
  { href: "/transaksi", icon: Receipt, label: "Riwayat Transaksi" },
  { href: "/laporan", icon: BarChart3, label: "Laporan" },
  { href: "/perangkat", icon: Monitor, label: "Perangkat" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r bg-white transition-all duration-300",
        "fixed top-0 left-0 h-full z-30",
        collapsed ? "w-20" : "w-64",
      )}
    >
      {/* Logo / Brand */}
      <div
        className={cn(
          "flex items-center border-b border-gray-100 p-4",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
            <Receipt className="h-5 w-5 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto hidden rounded-md p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 lg:block transition-colors duration-150"
        >
          {collapsed ? (
            <Maximize2 className="h-4 w-4" />
          ) : (
            <Minimize2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
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

      {/* Bottom Section */}
      <div className="border-t border-gray-100 p-3"></div>
    </aside>
  );
}
