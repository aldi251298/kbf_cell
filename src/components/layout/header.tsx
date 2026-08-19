"use client";

import { formatTanggal, formatJam } from "@/lib/utils";
import { Bell, Search, Calendar } from "lucide-react";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Header() {
  const tanggalRef = useRef<HTMLParagraphElement>(null);
  const jamRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      if (tanggalRef.current) {
        tanggalRef.current.textContent = formatTanggal(now);
      }
      if (jamRef.current) {
        jamRef.current.textContent = formatJam(now);
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-100 bg-white/95 px-4 backdrop-blur-md lg:px-6">
      {/* Left: Greeting */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mobile hamburger placeholder */}
        <button className="lg:hidden rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors duration-150">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight">
            Selamat datang, Pemilik
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Ringkasan aktivitas konter Anda
          </p>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari transaksi, produk, atau konter..."
            className="pl-10 pr-12 h-9 rounded-xl border-gray-200 bg-gray-50 text-sm placeholder:text-gray-400 focus:bg-white transition-colors duration-150"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Date Filter */}
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex items-center gap-2 h-9 rounded-xl border-gray-200 text-sm font-normal text-gray-600 hover:bg-gray-50 transition-colors duration-150"
        >
          <Calendar className="h-4 w-4" />
          <span>Hari Ini</span>
          <svg
            className="h-3 w-3 ml-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </Button>

        {/* Current Time */}
        <div className="hidden xl:block text-right px-2 border-l border-gray-100">
          <p className="text-xs text-gray-500" ref={tanggalRef}>
            {formatTanggal(new Date())}
          </p>
          <p className="text-xs font-semibold text-gray-900" ref={jamRef}>
            {formatJam(new Date())}
          </p>
        </div>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors duration-150">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}
