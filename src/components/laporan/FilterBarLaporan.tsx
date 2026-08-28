"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Calendar, CalendarDays } from "lucide-react";
import { Select } from "@/components/ui/select";
import type { FilterLaporan, PeriodeFilter } from "@/types/laporanAnalytics";
import { useUserProfile } from "@/lib/useUserProfile";

interface SelectOption {
  value: string;
  label: string;
}

interface FilterBarLaporanProps {
  filter: FilterLaporan;
  onChange: (filter: FilterLaporan) => void;
  loading?: boolean;
  disabled?: boolean;
}

const PERIODE_OPTIONS: SelectOption[] = [
  { value: "hari_ini", label: "Hari Ini" },
  { value: "7_hari", label: "7 Hari Terakhir" },
  { value: "30_hari", label: "30 Hari Terakhir" },
  { value: "bulan_ini", label: "Bulan Ini" },
  { value: "custom", label: "Custom Range" },
];

const KONTER_OPTIONS: SelectOption[] = [
  { value: "semua", label: "Semua Konter" },
  { value: "KONTER-001", label: "KONTER-001" },
  { value: "KONTER-002", label: "KONTER-002" },
  { value: "KONTER-003", label: "KONTER-003" },
];

const PROVIDER_OPTIONS: SelectOption[] = [
  { value: "semua", label: "Semua Provider" },
  { value: "digipos", label: "Digipos" },
  { value: "alpines", label: "Alpines" },
  { value: "manual", label: "Manual" },
];

function namaKonter(id: string | null | undefined): string {
  if (!id) return "—";
  const map: Record<string, string> = {
    "KONTER-001": "KBF Cell Pasar Baru",
    "KONTER-002": "Konter 2",
    "KONTER-003": "Konter 3",
  };
  return map[id] ?? id;
}

export function FilterBarLaporan({
  filter,
  onChange,
  disabled = false,
}: FilterBarLaporanProps) {
  const { profile, loading: profileLoading } = useUserProfile();
  const [tanggalMulaiStr, setTanggalMulaiStr] = useState("");
  const [tanggalSelesaiStr, setTanggalSelesaiStr] = useState("");

  // Sync with filter changes - use effect to update local state when props change
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => {
    if (filter.tanggalMulai) {
      setTanggalMulaiStr(filter.tanggalMulai.toISOString().split("T")[0]);
    }
    if (filter.tanggalSelesai) {
      setTanggalSelesaiStr(filter.tanggalSelesai.toISOString().split("T")[0]);
    }
  }, [filter.tanggalMulai, filter.tanggalSelesai]);

  // For operator, lock konterId to their konter
  const konterEfektif =
    profile?.role === "operator" ? profile.konterId! : filter.konterId;

  const handlePeriodeChange = (value: string) => {
    const newFilter = { ...filter, periode: value as PeriodeFilter };
    if (value !== "custom") {
      newFilter.tanggalMulai = undefined;
      newFilter.tanggalSelesai = undefined;
    }
    onChange(newFilter);
  };

  const handleKonterChange = (value: string) => {
    onChange({ ...filter, konterId: value });
  };

  const handleProviderChange = (value: string) => {
    onChange({ ...filter, provider: value });
  };

  const handleTanggalMulaiChange = (value: string) => {
    setTanggalMulaiStr(value);
    const date = value ? new Date(value + "T00:00:00") : undefined;
    onChange({ ...filter, tanggalMulai: date });
  };

  const handleTanggalSelesaiChange = (value: string) => {
    setTanggalSelesaiStr(value);
    const date = value ? new Date(value + "T23:59:59") : undefined;
    onChange({ ...filter, tanggalSelesai: date });
  };

  const showCustomDates = filter.periode === "custom";

  if (profileLoading) {
    return (
      <div
        className={cn(
          "bg-white border-b px-6 py-4 flex flex-col sm:flex-row items-center gap-4 sticky top-0 z-10",
          disabled && "opacity-50",
        )}
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-text-tertiary" />
          <div className="w-40 h-10 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-white border-b px-6 py-4 flex flex-col sm:flex-row items-center gap-4 sticky top-0 z-10",
        disabled && "opacity-50",
      )}
    >
      {/* Periode Select */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-text-tertiary" />
        <Select
          options={PERIODE_OPTIONS}
          value={filter.periode}
          onChange={handlePeriodeChange}
          placeholder="Pilih Periode"
          className="w-40"
        />
      </div>

      {/* Custom Date Range */}
      {showCustomDates && (
        <div className="flex items-center gap-2 border-l pl-4">
          <label className="text-xs text-text-tertiary whitespace-nowrap">
            Dari
          </label>
          <input
            type="date"
            value={tanggalMulaiStr}
            onChange={(e) => handleTanggalMulaiChange(e.target.value)}
            className="h-10 px-3 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            disabled={disabled}
            max={new Date().toISOString().split("T")[0]}
          />
          <span className="text-text-tertiary">s/d</span>
          <label className="text-xs text-text-tertiary whitespace-nowrap">
            Sampai
          </label>
          <input
            type="date"
            value={tanggalSelesaiStr}
            onChange={(e) => handleTanggalSelesaiChange(e.target.value)}
            className="h-10 px-3 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            disabled={disabled}
            max={new Date().toISOString().split("T")[0]}
          />
          <CalendarDays className="h-4 w-4 text-text-tertiary ml-1" />
        </div>
      )}

      {/* Konter Select - Admin only, Operator sees locked konter */}
      {profile?.role === "admin" ? (
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <Select
            options={KONTER_OPTIONS}
            value={filter.konterId}
            onChange={handleKonterChange}
            placeholder="Pilih Konter"
            className="w-44"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <span className="text-sm text-gray-500">Konter:</span>
          <span className="text-sm font-medium text-gray-900">
            {namaKonter(konterEfektif)}
          </span>
        </div>
      )}

      {/* Provider Select */}
      <div className="flex items-center gap-2">
        <Select
          options={PROVIDER_OPTIONS}
          value={filter.provider}
          onChange={handleProviderChange}
          placeholder="Pilih Provider"
          className="w-40"
        />
      </div>
    </div>
  );
}
