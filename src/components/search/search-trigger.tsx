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
        "flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
        collapsed && "justify-center",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground border-transparent"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-sidebar-border",
      )}
    >
      <SearchIcon className="size-4 shrink-0" />
      {collapsed ? null : (
        <>
          <span className="flex-1 text-left">{texts.search.open}</span>
          <kbd className="text-sidebar-foreground/60 border-sidebar-border rounded border px-1.5 py-0.5 font-sans text-[10px] font-medium">
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
