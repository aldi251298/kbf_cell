"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "./button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  const startItem = totalItems ? (currentPage - 1) * itemsPerPage! + 1 : 0;
  const endItem = totalItems
    ? Math.min(currentPage * itemsPerPage!, totalItems)
    : 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
      {totalItems && (
        <p className="text-sm text-text-tertiary">
          Menampilkan <span className="font-medium text-text-secondary">{startItem}</span> -{" "}
          <span className="font-medium text-text-secondary">{endItem}</span> dari{" "}
          <span className="font-medium text-text-secondary">{totalItems}</span> hasil
        </p>
      )}

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Sebelumnya</span>
        </Button>

        {getPageNumbers().map((page, idx) => (
          <span key={idx}>
            {page === "..." ? (
              <span className="h-9 w-9 flex items-center justify-center text-text-tertiary">
                <MoreHorizontal className="h-4 w-4" />
              </span>
            ) : (
              <Button
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-9 w-9 p-0",
                  page === currentPage && "shadow-button-sm",
                )}
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            )}
          </span>
        ))}

        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Selanjutnya</span>
        </Button>
      </div>
    </div>
  );
}
