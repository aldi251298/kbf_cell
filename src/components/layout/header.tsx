"use client";

import { getTodayWIBDateString } from "@/lib/utils";
import { Calendar, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const todayString = getTodayWIBDateString();
  const todayDate = new Date(todayString + "T00:00:00");
  const formattedToday = todayDate.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border-subtle bg-white/95 px-4 backdrop-blur-md lg:px-6">
      {/* Left: Greeting */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mobile hamburger placeholder */}
        <button
          className="lg:hidden rounded-lg p-2 text-text-tertiary hover:bg-surface-hover hover:text-text-secondary transition-colors duration-150"
          aria-label="Toggle menu"
        >
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
          <h1 className="text-lg font-semibold text-text-primary tracking-tight">
            Selamat datang, Pemilik
          </h1>
          <p className="text-xs text-text-tertiary mt-0.5">
            Berikut ringkasan transaksi hari ini
          </p>
        </div>
      </div>

      {/* Right: Date Filter Only */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Date Filter */}
        <div className="relative hidden sm:inline-flex">
          <Button
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2 h-10 rounded-lg border-border bg-white text-sm font-normal text-text-secondary hover:bg-surface-hover transition-colors duration-150"
            onClick={() => setDatePickerOpen(!datePickerOpen)}
            aria-haspopup="true"
            aria-expanded={datePickerOpen}
          >
            <Calendar className="h-4 w-4" strokeWidth={2} />
            <span>{formattedToday}</span>
            <ChevronDown className="h-3 w-3 ml-1" strokeWidth={2} />
          </Button>
          {datePickerOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white border border-border rounded-xl shadow-dropdown-md overflow-hidden">
              <div className="p-2">
                <p className="px-2 py-1.5 text-xs font-medium text-text-tertiary">
                  Pilih Tanggal
                </p>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                  onClick={() => setDatePickerOpen(false)}
                >
                  <Calendar className="h-4 w-4" strokeWidth={2} />
                  Hari Ini
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                  onClick={() => setDatePickerOpen(false)}
                >
                  <Calendar className="h-4 w-4" strokeWidth={2} />
                  Kemarin
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                  onClick={() => setDatePickerOpen(false)}
                >
                  <Calendar className="h-4 w-4" strokeWidth={2} />7 Hari
                  Terakhir
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                  onClick={() => setDatePickerOpen(false)}
                >
                  <Calendar className="h-4 w-4" strokeWidth={2} />
                  30 Hari Terakhir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
