"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  isCollapsed?: boolean;
}

export function NavItem({
  href,
  icon: Icon,
  label,
  isCollapsed = false,
}: NavItemProps) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-none px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden",
        active
          ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/25"
          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
        isCollapsed && "justify-center px-2",
      )}
    >
      {active && !isCollapsed && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/40" />
      )}
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-colors duration-200",
          active ? "text-white" : "text-gray-400",
        )}
      />
      {!isCollapsed && (
        <span
          className={cn(
            "transition-all duration-200",
            active ? "text-white" : "",
          )}
        >
          {label}
        </span>
      )}
    </Link>
  );
}
