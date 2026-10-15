"use client";

import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";

import {
  FoldersNav,
  type FolderNavItem,
} from "@/components/layout/folders-nav";
import { MainNav } from "@/components/layout/main-nav";
import { TagsNav, type TagNavItem } from "@/components/layout/tags-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { SearchTrigger } from "@/components/search/search-trigger";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { texts } from "@/lib/texts";
import { useStoredState } from "@/lib/use-stored-state";
import { cn } from "@/lib/utils";
import logoPlanify from "@/assets/logo-planify.png";

const SIDEBAR_STATES = ["expanded", "collapsed"] as const;

type SidebarState = (typeof SIDEBAR_STATES)[number];

/** Navegación lateral de escritorio; se puede colapsar a una barra de iconos. */
export function AppSidebar({
  user,
  folders,
  tags,
}: {
  user: { name: string; email: string };
  folders: FolderNavItem[];
  tags: TagNavItem[];
}) {
  const [state, setState] = useStoredState<SidebarState>(
    "planify:sidebar",
    "expanded",
    SIDEBAR_STATES,
  );
  const collapsed = state === "collapsed";

  return (
    <aside
      data-collapsed={collapsed ? "true" : undefined}
      className={cn(
        "bg-sidebar text-sidebar-foreground sticky top-0 hidden h-svh shrink-0 flex-col border-r transition-[width] duration-200 motion-reduce:transition-none md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b",
          collapsed ? "justify-center px-2" : "gap-2.5 px-4",
        )}
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground"
                  aria-label={texts.nav.expand}
                  onClick={() => setState("expanded")}
                >
                  <PanelLeftOpenIcon />
                </Button>
              }
            />
            <TooltipContent side="right">{texts.nav.expand}</TooltipContent>
          </Tooltip>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoPlanify.src} alt="" className="size-7 shrink-0" />
            <span className="font-heading text-base font-semibold">
              {texts.app.name}
            </span>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground ml-auto"
                    aria-label={texts.nav.collapse}
                    onClick={() => setState("collapsed")}
                  >
                    <PanelLeftCloseIcon />
                  </Button>
                }
              />
              <TooltipContent side="bottom">
                {texts.nav.collapse}
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        <SearchTrigger collapsed={collapsed} />

        <MainNav collapsed={collapsed} />

        <Separator className="my-2" />

        <FoldersNav folders={folders} collapsed={collapsed} />
        <TagsNav tags={tags} collapsed={collapsed} />
      </nav>

      <div
        className={cn(
          "flex items-center gap-1 border-t p-2",
          collapsed && "flex-col",
        )}
      >
        <NotificationBell />
        <div className={cn(!collapsed && "min-w-0 flex-1")}>
          <UserMenu user={user} collapsed={collapsed} />
        </div>
      </div>
    </aside>
  );
}
