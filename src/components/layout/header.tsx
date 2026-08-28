"use client";

import { getTodayWIBDateString } from "@/lib/utils";
import {
  Bell,
  Calendar,
  ChevronDown,
  Menu,
  LogOut,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/lib/useUserProfile";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { profile, loading } = useUserProfile();

  const todayString = getTodayWIBDateString();
  const todayDate = new Date(todayString + "T00:00:00");
  const formattedToday = todayDate.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  function namaKonter(id: string | null | undefined): string {
    if (!id) return "—";
    const map: Record<string, string> = {
      "KONTER-001": "KBF Cell Pasar Baru",
      "KONTER-002": "KBF Cell Jawi Jawi",
      "KONTER-003": "Konter 3",
    };
    return map[id] ?? id;
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

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
          {!loading && profile && (
            <p className="text-xs text-gray-500 mt-0.5">
              Selamat datang kembali, {profile.namaLengkap}!
            </p>
          )}
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

        {/* Notification bell */}
        <button
          className="relative h-10 w-10 inline-flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          aria-label="Notifikasi"
        >
          <Bell className="h-5 w-5" strokeWidth={2} />
        </button>

        {/* Profile Dropdown */}
        {!loading && profile && (
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 h-10 w-10 sm:w-auto rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors pr-3 pl-3 sm:pr-3"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              aria-haspopup="true"
              aria-expanded={profileMenuOpen}
            >
              <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {profile.namaLengkap.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile.namaLengkap}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {profile.role === "admin"
                    ? "Administrator"
                    : `Operator — ${namaKonter(profile.konterId)}`}
                </p>
              </div>
              <ChevronDown
                className="h-4 w-4 text-gray-500 flex-shrink-0"
                strokeWidth={2}
              />
            </button>

            {profileMenuOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileMenuOpen(false)}
                  aria-hidden="true"
                />
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden animate-fadeInUp">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-semibold">
                        {profile.namaLengkap.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {profile.namaLengkap}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Shield className="h-3 w-3 text-blue-600" />
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {profile.role === "admin"
                              ? "Administrator"
                              : "Operator"}
                          </span>
                        </div>
                        {profile.role === "operator" && profile.konterId && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {namaKonter(profile.konterId)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <LogOut className="h-4 w-4" strokeWidth={2} />
                      Keluar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Fallback when loading or no profile */}
        {loading && (
          <div className="h-10 w-10 sm:w-20 rounded-full bg-gray-200 animate-pulse" />
        )}
        {!loading && !profile && (
          <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
            ?
          </div>
        )}
      </div>
    </header>
  );
}
