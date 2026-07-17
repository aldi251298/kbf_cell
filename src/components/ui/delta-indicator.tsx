import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface DeltaIndicatorProps {
  value: number; // percentage change
  showValue?: boolean;
  className?: string;
}

export function DeltaIndicator({
  value,
  showValue = true,
  className,
}: DeltaIndicatorProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isZero = value === 0;

  return (
    <div
      className={cn("flex items-center gap-1 text-xs font-medium", className)}
    >
      {isPositive && <ArrowUp className="h-3.5 w-3.5 text-success" />}
      {isNegative && <ArrowDown className="h-3.5 w-3.5 text-error" />}
      {isZero && <Minus className="h-3.5 w-3.5 text-text-tertiary" />}

      {showValue && (
        <span
          className={cn(
            isPositive && "text-success",
            isNegative && "text-error",
            isZero && "text-text-tertiary",
          )}
        >
          {isZero ? "0.0%" : `${isPositive ? "+" : ""}${value.toFixed(1)}%`}
        </span>
      )}
    </div>
  );
}
