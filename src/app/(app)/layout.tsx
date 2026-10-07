import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { requireSession } from "@/lib/session";
import { texts } from "@/lib/texts";
import { listFolders } from "@/server/services/folders";
import { listTags } from "@/server/services/tags";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();

  const [folders, tags] = await Promise.all([
    listFolders(session.user.id),
    listTags(session.user.id),
  ]);

  const user = { name: session.user.name, email: session.user.email };

  return (
    <div className="bg-background flex min-h-svh">
      <a
        href="#contenido"
        className="focus:bg-background focus:text-foreground sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:border focus:px-3 focus:py-2 focus:text-sm"
      >
        {texts.nav.skipToContent}
      </a>

      <AppSidebar user={user} folders={folders} tags={tags} />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav user={user} folders={folders} tags={tags} />
        <main id="contenido" className="flex min-w-0 flex-1 flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
