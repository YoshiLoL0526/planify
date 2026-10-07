import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { requireSession } from "@/lib/session";
import { listFolders } from "@/server/services/folders";
import { listTags } from "@/server/services/tags";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();

  const [folders, tags] = await Promise.all([
    listFolders(session.user.id),
    listTags(session.user.id),
  ]);

  return (
    <div className="bg-background flex min-h-svh">
      <AppSidebar
        user={{ name: session.user.name, email: session.user.email }}
        folders={folders}
        tags={tags}
      />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
