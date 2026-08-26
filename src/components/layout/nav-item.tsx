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
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "bg-accent-muted text-accent"
          : "text-text-secondary hover:bg-surface-hover hover:text-text-primary",
        isCollapsed && "justify-center px-2",
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-colors duration-200 stroke-[1.8]",
          active ? "text-accent" : "text-text-tertiary",
        )}
      />
      {!isCollapsed && (
        <span
          className={cn(
            "transition-colors duration-200",
            active ? "text-accent" : "",
          )}
        >
          {label}
        </span>
      )}
    </Link>
  );
}
