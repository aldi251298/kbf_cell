import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "default" | "status" | "highlight";
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
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md",
        variant === "highlight" &&
          "border-blue-100 bg-blue-50/30 shadow-sm hover:shadow-md",
        variant === "status" &&
          status &&
          {
            success: "border-green-100 bg-green-50/30",
            warning: "border-amber-100 bg-amber-50/30",
            error: "border-red-100 bg-red-50/30",
            info: "border-blue-100 bg-blue-50/30",
            offline: "border-gray-100 bg-gray-50/30",
          }[status],
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
      className={cn("px-5 py-4 border-b border-gray-50", className)}
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
        "text-sm font-medium text-gray-500 leading-none tracking-tight",
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
    <p className={cn("text-xs text-gray-400 mt-0.5", className)} {...props}>
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
          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
            {icon}
          </div>
        )}
        <p className="text-2xl font-bold text-gray-900 tracking-tight">
          {value}
        </p>
      </div>
      {children}
    </div>
  );
}
