import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  return (
    <div className="bg-muted/40 flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
