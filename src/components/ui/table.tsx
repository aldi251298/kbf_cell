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
      >
        {props.children}
      </table>
    </div>
  );
}

export function TableHeader({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"thead"> & { children?: ReactNode }) {
  return (
    <thead
      className={cn("[&_tr]:border-b [&_tr]:border-border", className)}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"tbody"> & { children?: ReactNode }) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableFooter({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"tfoot"> & { children?: ReactNode }) {
  return (
    <tfoot
      className={cn(
        "border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    >
      {children}
    </tfoot>
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
      {children}
      {sortable && (
        <span className="ml-1 inline-flex flex-col">
          {sorted === "asc" ? (
            <ChevronUp className="h-3 w-3" />
          ) : sorted === "desc" ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronUp className="h-3 w-3 opacity-30" />
          )}
        </span>
      )}
    </th>
  );
}
