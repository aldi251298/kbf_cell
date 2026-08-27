"use client";

import { getTodayWIBDateString } from "@/lib/utils";
import { Bell, Calendar, ChevronDown, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const todayString = getTodayWIBDateString();
  const todayDate = new Date(todayString + "T00:00:00");
  const formattedToday = todayDate.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-100 bg-white px-4 lg:px-8">
      {/* Left: Hamburger menu (mobile) + Page title + greeting */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Hamburger menu - only visible on mobile */}
        <button
          type="button"
          className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          onClick={onMenuClick}
          aria-label="Buka menu"
          aria-expanded="false"
        >
          <Menu className="h-6 w-6" strokeWidth={2} />
        </button>

        <div>
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Selamat datang kembali, Admin!
          </p>
        </div>
      </div>

      {/* Right: Date + Notification + Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Date */}
        <div className="relative hidden sm:inline-flex">
          <Button
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2 h-10 rounded-lg border-gray-200 bg-white text-sm font-normal text-gray-600 hover:bg-gray-50 transition-colors duration-150"
            onClick={() => setDatePickerOpen(!datePickerOpen)}
            aria-haspopup="true"
            aria-expanded={datePickerOpen}
          >
            <Calendar className="h-4 w-4" strokeWidth={2} />
            <span>{formattedToday}</span>
            <ChevronDown className="h-3 w-3 ml-1" strokeWidth={2} />
          </Button>
          {datePickerOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
              <div className="p-2">
                <p className="px-2 py-1.5 text-xs font-medium text-gray-400">
                  Pilih Tanggal
                </p>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  onClick={() => setDatePickerOpen(false)}
                >
                  <Calendar className="h-4 w-4" strokeWidth={2} />
                  Hari Ini
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  onClick={() => setDatePickerOpen(false)}
                >
                  <Calendar className="h-4 w-4" strokeWidth={2} />
                  Kemarin
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  onClick={() => setDatePickerOpen(false)}
                >
                  <Calendar className="h-4 w-4" strokeWidth={2} />7 Hari
                  Terakhir
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  onClick={() => setDatePickerOpen(false)}
                >
                  <Calendar className="h-4 w-4" strokeWidth={2} />
                  30 Hari Terakhir
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notification bell (static placeholder — no notification data source yet) */}
        <button
          className="relative h-10 w-10 inline-flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          aria-label="Notifikasi"
        >
          <Bell className="h-5 w-5" strokeWidth={2} />
        </button>

        {/* Profile avatar (static placeholder) */}
        <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
          A
        </div>
      </div>
    </header>
  );
}
