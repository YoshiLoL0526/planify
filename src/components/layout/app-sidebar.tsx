import Link from "next/link";
import {
  ArchiveIcon,
  ClockIcon,
  FolderKanbanIcon,
  HouseIcon,
  StarIcon,
} from "lucide-react";

import { UserMenu } from "@/components/layout/user-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { texts } from "@/lib/texts";

/** Secciones que llegarán en la siguiente fase (deshabilitadas con pista). */
const upcomingItems = [
  { label: texts.nav.favorites, icon: StarIcon },
  { label: texts.nav.recent, icon: ClockIcon },
  { label: texts.nav.archived, icon: ArchiveIcon },
];

export function AppSidebar({
  user,
}: {
  user: { name: string; email: string };
}) {
  return (
    <aside className="bg-sidebar text-sidebar-foreground sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <FolderKanbanIcon className="text-primary size-5" />
        <span className="font-heading text-base font-semibold">
          {texts.app.name}
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        <Link
          href="/"
          className="bg-sidebar-accent text-sidebar-accent-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium"
        >
          <HouseIcon className="size-4" />
          {texts.nav.home}
        </Link>

        {upcomingItems.map(({ label, icon: Icon }) => (
          <Tooltip key={label}>
            <TooltipTrigger
              aria-disabled="true"
              className="text-muted-foreground/70 flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm outline-none"
            >
              <Icon className="size-4" />
              {label}
            </TooltipTrigger>
            <TooltipContent side="right">{texts.nav.comingSoon}</TooltipContent>
          </Tooltip>
        ))}
      </nav>

      <div className="border-t p-2">
        <UserMenu user={user} />
      </div>
    </aside>
  );
}
