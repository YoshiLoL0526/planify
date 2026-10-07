import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { requireSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();

  return (
    <div className="bg-background flex min-h-svh">
      <AppSidebar
        user={{ name: session.user.name, email: session.user.email }}
      />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
