"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export function Table({
  className,
  ...props
}: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="relative w-full overflow-auto rounded-xl border border-border bg-card shadow-card">
      <table
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function TableHeader({
  className,
  ...props
}: ComponentPropsWithoutRef<"thead">) {
  return (
    <thead
      className={cn("[&_tr]:border-b [&_tr]:border-border", className)}
      {...props}
    />
  );
}

export function TableBody({
  className,
  ...props
}: ComponentPropsWithoutRef<"tbody">) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  );
}

export function TableFooter({
  className,
  ...props
}: ComponentPropsWithoutRef<"tfoot">) {
  return (
    <tfoot
      className={cn(
        "border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

export function TableRow({
  className,
  ...props
}: ComponentPropsWithoutRef<"tr">) {
  return (
    <tr
      className={cn(
        "border-b border-border transition-colors duration-150 hover:bg-surface-hover/50 data-[state=selected]:bg-muted",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: ComponentPropsWithoutRef<"th">) {
  return (
    <th
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-text-tertiary text-xs uppercase tracking-wider",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: ComponentPropsWithoutRef<"td">) {
  return <td className={cn("p-4 align-middle", className)} {...props} />;
}

interface SortableTableHeadProps extends ComponentPropsWithoutRef<"th"> {
  sortable?: boolean;
  sorted?: "asc" | "desc" | null;
  onSort?: () => void;
  children?: ReactNode;
}

export function SortableTableHead({
  sortable,
  sorted,
  onSort,
  className,
  children,
  ...props
}: SortableTableHeadProps) {
  return (
    <th
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-text-tertiary text-xs uppercase tracking-wider",
        sortable &&
          "cursor-pointer select-none hover:text-text-secondary transition-colors duration-150",
        className,
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortable && (
          <span className="ml-1 opacity-50">
            {sorted === "asc" ? (
              <ChevronUp className="h-3.5 w-3.5 text-accent" />
            ) : sorted === "desc" ? (
              <ChevronDown className="h-3.5 w-3.5 text-accent" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </span>
        )}
      </div>
    </th>
  );
}
