"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";

import { FOCUS_SEARCH_EVENT } from "@/components/search/focus-event";
import { texts } from "@/lib/texts";
import { cn } from "@/lib/utils";

/** Botón de búsqueda de la sidebar + atajo global Ctrl/⌘+K (docs/08 · 8.6). */
export function SearchTrigger() {
  const router = useRouter();
  const pathname = usePathname();
  const active = pathname.startsWith("/search");

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (pathname.startsWith("/search")) {
          window.dispatchEvent(new Event(FOCUS_SEARCH_EVENT));
        } else {
          router.push("/search");
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pathname, router]);

  return (
    <button
      type="button"
      onClick={() => router.push("/search")}
      className={cn(
        "flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground border-transparent"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-sidebar-border",
      )}
    >
      <SearchIcon className="size-4 shrink-0" />
      <span className="flex-1 text-left">{texts.search.open}</span>
      <kbd className="text-sidebar-foreground/60 border-sidebar-border rounded border px-1.5 py-0.5 font-sans text-[10px] font-medium">
        Ctrl K
      </kbd>
    </button>
  );
}
