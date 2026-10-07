"use client";

import { useEffect, useState } from "react";
import { FolderKanbanIcon, MenuIcon, XIcon } from "lucide-react";

import {
  FoldersNav,
  type FolderNavItem,
} from "@/components/layout/folders-nav";
import { MainNav } from "@/components/layout/main-nav";
import { TagsNav, type TagNavItem } from "@/components/layout/tags-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { SearchTrigger } from "@/components/search/search-trigger";
import { Separator } from "@/components/ui/separator";
import { texts } from "@/lib/texts";

/** Cabecera y drawer de navegación para móvil/tablet (docs/08 · 8.7). */
export function MobileNav({
  user,
  folders,
  tags,
}: {
  user: { name: string; email: string };
  folders: FolderNavItem[];
  tags: TagNavItem[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <header className="bg-background sticky top-0 z-40 flex h-14 items-center gap-3 border-b px-4 md:hidden">
        <button
          type="button"
          aria-label={texts.nav.menu}
          onClick={() => setOpen(true)}
          className="text-muted-foreground hover:text-foreground rounded-md p-1.5"
        >
          <MenuIcon className="size-5" />
        </button>
        <span className="font-heading flex items-center gap-2 text-base font-semibold">
          <FolderKanbanIcon className="text-primary size-5" />
          {texts.app.name}
        </span>
        <div className="ml-auto">
          <NotificationBell />
        </div>
      </header>

      {open ? (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={texts.nav.menu}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="bg-sidebar text-sidebar-foreground absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-1 overflow-y-auto p-2 shadow-xl"
            onClick={(event) => {
              // Cierra el drawer al navegar con cualquier enlace.
              if ((event.target as HTMLElement).closest("a")) setOpen(false);
            }}
          >
            <div className="flex items-center justify-between p-1">
              <span className="font-heading flex items-center gap-2 px-1 text-base font-semibold">
                <FolderKanbanIcon className="text-primary size-5" />
                {texts.app.name}
              </span>
              <button
                type="button"
                aria-label={texts.nav.closeMenu}
                onClick={() => setOpen(false)}
                className="hover:bg-sidebar-accent rounded-md p-1.5"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <SearchTrigger />
            <MainNav />
            <Separator className="my-2" />
            <FoldersNav folders={folders} />
            <TagsNav tags={tags} />

            <div className="mt-auto border-t pt-2">
              <UserMenu user={user} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
