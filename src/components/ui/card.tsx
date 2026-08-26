import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant =
  | "default"
  | "status"
  | "highlight"
  | "summary-income"
  | "summary-revenue"
  | "summary-balance"
  | "summary-transactions"
  | "summary-alpines"
  | "gradient-blue"
  | "gradient-emerald"
  | "gradient-purple"
  | "gradient-amber"
  | "gradient-rose"
  | "gradient-cyan"
  | "gradient-indigo"
  | "gradient-orange";
type StatusType = "success" | "warning" | "error" | "info" | "offline";

interface CardRootProps extends ComponentPropsWithoutRef<"div"> {
  variant?: Variant;
  status?: StatusType;
}

export function Card({
  className,
  variant = "default",
  status,
  children,
  ...props
}: CardRootProps) {
  const variantStyles = {
    default:
      "border border-card-border bg-card shadow-card hover:shadow-card-hover",
    highlight:
      "border-accent/20 bg-accent/5 shadow-card hover:shadow-card-hover",
    status: (() => {
      if (!status) return "";
      const statusMap = {
        success: "border-success/20 bg-success/5",
        warning: "border-warning/20 bg-warning/5",
        error: "border-error/20 bg-error/5",
        info: "border-info/20 bg-info/5",
        offline: "border-offline/20 bg-offline/5",
      } as const;
      return statusMap[status] ?? "";
    })(),
    // Summary card variants — Premium gradient backgrounds with white text
    "summary-income":
      "bg-gradient-to-br from-[hsl(var(--card-income-from))] to-[hsl(var(--card-income-to))] border-card-income-border shadow-lg shadow-[hsl(var(--card-income))/0.25] hover:shadow-xl hover:shadow-[hsl(var(--card-income))/0.35] hover:-translate-y-1",
    "summary-revenue":
      "bg-gradient-to-br from-[hsl(var(--card-revenue-from))] to-[hsl(var(--card-revenue-to))] border-card-revenue-border shadow-lg shadow-[hsl(var(--card-revenue))/0.25] hover:shadow-xl hover:shadow-[hsl(var(--card-revenue))/0.35] hover:-translate-y-1",
    "summary-balance":
      "bg-gradient-to-br from-[hsl(var(--card-balance-from))] to-[hsl(var(--card-balance-to))] border-card-balance-border shadow-lg shadow-[hsl(var(--card-balance))/0.25] hover:shadow-xl hover:shadow-[hsl(var(--card-balance))/0.35] hover:-translate-y-1",
    "summary-transactions":
      "bg-gradient-to-br from-[hsl(var(--card-transactions-from))] to-[hsl(var(--card-transactions-to))] border-card-transactions-border shadow-lg shadow-[hsl(var(--card-transactions))/0.25] hover:shadow-xl hover:shadow-[hsl(var(--card-transactions))/0.35] hover:-translate-y-1",
    // Alpines balance card — Credit card style, horizontal, smaller
    "summary-alpines":
      "bg-gradient-to-r from-cyan-700 via-cyan-800 to-teal-800 border-cyan-500/30 shadow-lg shadow-cyan-900/40 hover:shadow-xl hover:shadow-cyan-900/50 hover:-translate-y-0.5 rounded-xl",
    // Legacy gradient variants (kept for compatibility)
    "gradient-blue":
      "bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg shadow-blue-600/25",
    "gradient-emerald":
      "bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-lg shadow-emerald-600/25",
    "gradient-purple":
      "bg-gradient-to-br from-purple-600 to-purple-800 shadow-lg shadow-purple-600/25",
    "gradient-amber":
      "bg-gradient-to-br from-amber-600 to-amber-800 shadow-lg shadow-amber-600/25",
    "gradient-rose":
      "bg-gradient-to-br from-rose-600 to-rose-800 shadow-lg shadow-rose-600/25",
    "gradient-cyan":
      "bg-gradient-to-br from-cyan-600 to-cyan-800 shadow-lg shadow-cyan-600/25",
    "gradient-indigo":
      "bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-lg shadow-indigo-600/25",
    "gradient-orange":
      "bg-gradient-to-br from-orange-600 to-orange-800 shadow-lg shadow-orange-600/25",
  };

  const isGradientVariant = variant.startsWith("gradient-");
  const isSummaryVariant = variant.startsWith("summary-");
  const baseStyles = isGradientVariant
    ? "rounded-2xl border-0 text-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    : isSummaryVariant
      ? "rounded-2xl border-0 text-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      : "rounded-2xl border bg-card shadow-card transition-all duration-200 hover:shadow-card-hover";

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant as keyof typeof variantStyles],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends ComponentPropsWithoutRef<"div"> {
  children?: ReactNode;
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn("px-6 py-5 border-b border-border-subtle", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardTitleProps extends ComponentPropsWithoutRef<"h3"> {
  children?: ReactNode;
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn(
        "text-sm font-medium text-text-secondary leading-none tracking-tight",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

interface CardDescriptionProps extends ComponentPropsWithoutRef<"p"> {
  children?: ReactNode;
}

export function CardDescription({
  className,
  children,
  ...props
}: CardDescriptionProps) {
  return (
    <p
      className={cn("text-xs text-text-tertiary mt-0.5", className)}
      {...props}
    >
      {children}
    </p>
  );
}

interface CardContentProps extends ComponentPropsWithoutRef<"div"> {
  children?: ReactNode;
}

export function CardContent({
  className,
  children,
  ...props
}: CardContentProps) {
  return (
    <div className={cn("p-6 pt-5", className)} {...props}>
      {children}
    </div>
  );
}

interface CardMetricProps extends ComponentPropsWithoutRef<"div"> {
  icon?: ReactNode;
  value: string | number;
  className?: string;
}

export function CardMetric({
  className,
  icon,
  value,
  children,
  ...props
}: CardMetricProps) {
  return (
    <div className={cn("space-y-1", className)} {...props}>
      <div className="flex items-center gap-2">
        {icon && (
          <div className="h-8 w-8 rounded-none bg-white/20 flex items-center justify-center backdrop-blur-sm">
            {icon}
          </div>
        )}
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      </div>
      {children}
    </div>
  );
}
