import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { FileTextIcon, MessagesSquareIcon, ShapesIcon } from "lucide-react";

import { getSession } from "@/lib/session";
import { texts } from "@/lib/texts";
import logoPlanify from "@/assets/logo-planify.png";

const FEATURES = [
  { icon: FileTextIcon, ...texts.auth.features.notes },
  { icon: ShapesIcon, ...texts.auth.features.diagrams },
  { icon: MessagesSquareIcon, ...texts.auth.features.collaborate },
];

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
    <div className="bg-background grid min-h-svh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="bg-primary text-primary-foreground relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-black/10 blur-3xl"
        />

        <div className="relative flex items-center gap-2.5 text-lg font-semibold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoPlanify.src} alt="" className="size-9 shrink-0" />
          {texts.app.name}
        </div>

        <div className="relative flex max-w-md flex-col gap-8">
          <h2 className="font-heading text-3xl leading-tight font-semibold">
            {texts.app.tagline}
          </h2>
          <ul className="flex flex-col gap-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-sm opacity-80">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs opacity-70">{texts.app.description}</p>
      </aside>

      <main className="bg-muted/40 flex flex-col items-center justify-center gap-6 p-6">
        <div className="text-foreground flex items-center gap-2.5 text-lg font-semibold lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoPlanify.src} alt="" className="size-9 shrink-0" />
          {texts.app.name}
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
