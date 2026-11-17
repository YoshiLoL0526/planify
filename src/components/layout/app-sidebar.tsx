"use client";

import { PanelLeftCloseIcon } from "lucide-react";
import Link from "next/link";

import { Logo, LogoMark } from "@/components/brand/logo";
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

const SIDEBAR_STATES = ["expanded", "collapsed"] as const;

type SidebarState = (typeof SIDEBAR_STATES)[number];

/** Navegación lateral de escritorio; se puede colapsar a una barra de iconos. */
export function AppSidebar({
  user,
  tags,
}: {
  user: { name: string; email: string };
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
          "flex h-14 shrink-0 items-center border-b",
          collapsed ? "justify-center px-2" : "gap-2 px-3.5",
        )}
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary hover:bg-sidebar-accent"
                  aria-label={texts.nav.expand}
                  onClick={() => setState("expanded")}
                >
                  <LogoMark className="size-6" />
                </Button>
              }
            />
            <TooltipContent side="right">{texts.nav.expand}</TooltipContent>
          </Tooltip>
        ) : (
          <>
            <Link
              href="/"
              className="focus-visible:ring-ring/30 flex min-w-0 items-center rounded-md outline-none focus-visible:ring-2"
            >
              <Logo />
            </Link>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:bg-sidebar-accent ml-auto"
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

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-3">
        <SearchTrigger collapsed={collapsed} />

        <div className="mt-1 flex flex-col gap-0.5">
          <MainNav collapsed={collapsed} />
        </div>

        <Separator className="my-2.5" />

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
