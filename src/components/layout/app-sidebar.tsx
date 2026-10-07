import { FolderKanbanIcon } from "lucide-react";

import {
  FoldersNav,
  type FolderNavItem,
} from "@/components/layout/folders-nav";
import { MainNav } from "@/components/layout/main-nav";
import { TagsNav, type TagNavItem } from "@/components/layout/tags-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { Separator } from "@/components/ui/separator";
import { texts } from "@/lib/texts";

export function AppSidebar({
  user,
  folders,
  tags,
}: {
  user: { name: string; email: string };
  folders: FolderNavItem[];
  tags: TagNavItem[];
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
        <MainNav />

        <Separator className="my-2" />

        <FoldersNav folders={folders} />
        <TagsNav tags={tags} />
      </nav>

      <div className="border-t p-2">
        <UserMenu user={user} />
      </div>
    </aside>
  );
}
