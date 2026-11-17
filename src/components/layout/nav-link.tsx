"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  icon: Icon,
  label,
  collapsed = false,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  const link = (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? label : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
      )}
    >
      {active && !collapsed ? (
        <span
          aria-hidden
          className="bg-primary absolute top-1.5 bottom-1.5 left-0 w-[2px] rounded-full"
        />
      ) : null}
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active
            ? "text-primary"
            : "text-sidebar-foreground/45 group-hover:text-sidebar-accent-foreground",
        )}
      />
      {collapsed ? null : <span className="truncate">{label}</span>}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
