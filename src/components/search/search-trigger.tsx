"use client";

import { usePathname } from "next/navigation";
import { SearchIcon } from "lucide-react";

import {
  FOCUS_SEARCH_EVENT,
  OPEN_SEARCH_EVENT,
} from "@/components/search/focus-event";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { texts } from "@/lib/texts";
import { useModKey } from "@/lib/use-mod-key";
import { cn } from "@/lib/utils";

/** Botón de búsqueda de la sidebar; abre el modal global (Ctrl/⌘+K). */
export function SearchTrigger({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  const active = pathname.startsWith("/search");
  const modKey = useModKey();

  const button = (
    <button
      type="button"
      data-close-drawer
      aria-keyshortcuts="Control+K Meta+K"
      aria-label={collapsed ? texts.search.open : undefined}
      onClick={() =>
        window.dispatchEvent(
          new Event(active ? FOCUS_SEARCH_EVENT : OPEN_SEARCH_EVENT),
        )
      }
      className={cn(
        "flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-[13px] transition-[background-color,border-color,color]",
        collapsed && "justify-center px-0",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground border-transparent"
          : "border-sidebar-border bg-background/45 text-sidebar-foreground/65 hover:border-foreground/15 hover:bg-background hover:text-sidebar-foreground",
      )}
    >
      <SearchIcon className="size-4 shrink-0" />
      {collapsed ? null : (
        <>
          <span className="flex-1 text-left">{texts.search.open}</span>
          <kbd className="border-sidebar-border bg-background/70 text-sidebar-foreground/55 rounded border px-1.5 py-0.5 font-sans text-[10px] font-medium tracking-wide">
            {modKey} K
          </kbd>
        </>
      )}
    </button>
  );

  if (!collapsed) return button;

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent side="right">
        {texts.search.open}
        <kbd
          data-slot="kbd"
          className="border-background/25 rounded-sm border px-1 font-sans text-[10px] font-medium"
        >
          {modKey} K
        </kbd>
      </TooltipContent>
    </Tooltip>
  );
}
