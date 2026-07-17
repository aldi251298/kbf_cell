"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:border-border-strong transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isOpen && "border-accent ring-1 ring-accent/30",
          className,
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className={selectedOption ? "text-foreground" : "text-text-tertiary"}
        >
          {selectedOption?.label || placeholder}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 opacity-50" />
        ) : (
          <ChevronDown className="h-4 w-4 opacity-50" />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-1 min-w-full w-full rounded-lg border border-border bg-card shadow-dropdown-md text-sm max-h-60 overflow-auto">
            {options.map((option) => (
              <button
                key={option.value}
                className={cn(
                  "flex w-full items-center px-3 py-2.5 text-left transition-colors duration-150",
                  option.value === value
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-foreground hover:bg-surface-hover",
                  "first:rounded-t-lg last:rounded-b-lg",
                )}
                onClick={() => {
                  onChange?.(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
