import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant =
  | "default"
  | "status"
  | "highlight"
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
    default: "border border-gray-100 bg-white shadow-sm hover:shadow-md",
    highlight: "border-blue-100 bg-blue-50/30 shadow-sm hover:shadow-md",
    status:
      status &&
      {
        success: "border-green-100 bg-green-50/30",
        warning: "border-amber-100 bg-amber-50/30",
        error: "border-red-100 bg-red-50/30",
        info: "border-blue-100 bg-blue-50/30",
        offline: "border-gray-100 bg-gray-50/30",
      }[status],
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
  const baseStyles = isGradientVariant
    ? "rounded-none border-0 text-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    : "rounded-none border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md";

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
      className={cn("px-5 py-4 border-b border-white/10", className)}
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
        "text-sm font-medium text-white/80 leading-none tracking-tight",
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
    <p className={cn("text-xs text-white/60 mt-0.5", className)} {...props}>
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
    <div className={cn("p-5 pt-4", className)} {...props}>
      {children}
    </div>
  );
}

interface CardMetricProps extends ComponentPropsWithoutRef<"div"> {
  icon?: ReactNode;
  value: string | number;
  delta?: number;
  className?: string;
}

export function CardMetric({
  className,
  icon,
  value,
  delta,
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
