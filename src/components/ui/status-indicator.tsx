import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import type { StatusOnline } from "@/types";
import { STATUS_ONLINE_LABELS } from "@/constants/perangkat";

interface StatusIndicatorProps {
  status: StatusOnline;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  size = "md",
  showLabel = true,
  className,
}: StatusIndicatorProps) {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
  };

  const pulseClasses = {
    online: "animate-pulse",
    offline: "",
    menyiram: "animate-pulse",
  };

  const badgeVariant = {
    online: "success" as const,
    offline: "offline" as const,
    menyiram: "warning" as const,
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "rounded-full",
          sizeClasses[size],
          pulseClasses[status],
          {
            online: "bg-success",
            offline: "bg-offline",
            menyiram: "bg-warning",
          }[status],
        )}
      />
      {showLabel && (
        <Badge variant={badgeVariant[status]} size="sm">
          {STATUS_ONLINE_LABELS[status]}
        </Badge>
      )}
    </div>
  );
}
