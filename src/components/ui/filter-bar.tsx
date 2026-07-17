import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { Input } from "./input";
import { Select } from "./select";
import { Button } from "./button";

interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchClear?: () => void;
  filters?: {
    label: string;
    options: { value: string; label: string }[];
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
  }[];
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  onSearchClear,
  filters,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row gap-3", className)}>
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
        <Input
          placeholder="Cari transaksi..."
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
            onClick={() => {
              onSearchChange?.("");
              onSearchClear?.();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter Dropdowns */}
      {filters?.map((filter, idx) => (
        <Select
          key={idx}
          options={filter.options}
          value={filter.value}
          onChange={filter.onChange}
          placeholder={filter.placeholder}
          className="w-full sm:w-48"
        />
      ))}
    </div>
  );
}
