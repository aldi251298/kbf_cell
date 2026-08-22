"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  return (
    <div className={cn("relative inline-block w-full", className)}>
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:border-border-strong transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isOpen && "border-accent ring-1 ring-accent/30",
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
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
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 min-w-full w-full rounded-lg border border-border bg-card shadow-dropdown-md text-sm max-h-60 overflow-auto"
          style={{ top: "100%", left: 0 }}
        >
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
      )}
    </div>
  );
}

// Floating Select - uses portal for dropdown that floats above everything
export function SelectFloating({
  options,
  value,
  onChange,
  placeholder,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((opt) => opt.value === value);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  // Calculate dropdown position with viewport awareness
  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownHeight = Math.min(options.length * 48 + 8, 480); // Estimate height, max 480px
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Determine if dropdown should open upward
      const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
      
      let top: number;
      if (openUpward) {
        top = rect.top - dropdownHeight - 4;
      } else {
        top = rect.bottom + 4;
      }
      
      // Ensure dropdown stays within viewport horizontally
      let left = rect.left;
      const dropdownWidth = rect.width;
      if (left + dropdownWidth > viewportWidth - 16) {
        left = viewportWidth - dropdownWidth - 16;
      }
      if (left < 16) {
        left = 16;
      }

      setDropdownStyle({
        top: `${top}px`,
        left: `${left}px`,
        width: `${dropdownWidth}px`,
        maxHeight: `${dropdownHeight}px`,
      });
    }
  };

  // Update position synchronously when opened
  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, options.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Render dropdown content inside render so it updates with current state
  const renderDropdownContent = () => (
    <div
      ref={dropdownRef}
      className="fixed z-50 rounded-lg border border-border bg-card shadow-lg text-sm overflow-auto fade-in"
      style={dropdownStyle}
    >
      {options.map((option) => (
        <button
          key={option.value}
          className={cn(
            "flex w-full items-center px-3 py-3 text-left transition-colors duration-150",
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
  );

  // Render backdrop and dropdown via portal when open
  const portalContent = isOpen
    ? createPortal(
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          {renderDropdownContent()}
        </>,
        document.body
      )
    : null;

  return (
    <div className={cn("relative inline-block w-full", className)}>
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:border-border-strong transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isOpen && "border-accent ring-1 ring-accent/30",
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
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

      {portalContent}
    </div>
  );
}
