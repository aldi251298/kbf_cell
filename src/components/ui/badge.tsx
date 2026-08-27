import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-700 border border-gray-200",
        success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        warning: "bg-amber-50 text-amber-700 border border-amber-200",
        error: "bg-red-50 text-red-700 border border-red-200",
        info: "bg-blue-50 text-blue-700 border border-blue-200",
        offline: "bg-gray-100 text-gray-600 border border-gray-200",
        outline:
          "border border-gray-300 bg-transparent text-gray-600 hover:bg-gray-50",
      },
      size: {
        sm: "px-3 py-1 text-[11px]",
        default: "px-3.5 py-1.5 text-xs",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const STATUS_DOT_COLORS: Record<string, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-blue-500",
  offline: "bg-gray-400",
  default: "bg-gray-400",
};

interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, dot, children, ...props }, ref) => {
    const dotColor = dot && variant ? STATUS_DOT_COLORS[variant] : undefined;

    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size, className }))}
        {...props}
      >
        {dot && dotColor && (
          <span
            className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", dotColor)}
          />
        )}
        {children}
      </div>
    );
  },
);
Badge.displayName = "Badge";
