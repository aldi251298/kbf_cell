import { cn } from "@/lib/utils";
import { SearchX } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-secondary/50 py-12 px-4",
        className,
      )}
    >
      <div className="mb-4 rounded-full bg-surface-hover p-3">
        {icon || <SearchX className="h-6 w-6 text-text-tertiary" />}
      </div>
      <h3 className="text-base font-display font-semibold text-foreground mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-text-tertiary text-center max-w-sm mb-4">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
