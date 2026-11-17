import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { FileTextIcon, MessagesSquareIcon, ShapesIcon } from "lucide-react";

import { Logo, LogoMark } from "@/components/brand/logo";
import { getSession } from "@/lib/session";
import { texts } from "@/lib/texts";
import { APP_VERSION } from "@/lib/version";

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
    <div className="bg-background grid min-h-svh lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[oklch(0.215_0.022_268)] p-12 text-[oklch(0.96_0.004_85)] lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgb(255 255 255 / 0.055) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.055) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage:
              "radial-gradient(ellipse at 30% 20%, black, transparent 78%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 size-[34rem] rounded-full bg-[oklch(0.72_0.1_288_/_0.2)] blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-48 -left-24 size-[28rem] rounded-full bg-[oklch(0.72_0.08_205_/_0.1)] blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <LogoMark className="size-8 text-[oklch(0.82_0.06_288)]" />
          <span className="text-lg font-semibold tracking-[-0.02em]">
            {texts.app.name}
          </span>
        </div>

        <div className="relative max-w-xl">
          <h2 className="font-heading text-[2.9rem] leading-[1.02] font-medium tracking-[-0.035em] text-balance">
            {texts.app.tagline}
          </h2>

          <ul className="mt-10 flex flex-col border-t border-white/10">
            {FEATURES.map(({ icon: Icon, title, description }, index) => (
              <li
                key={title}
                className="flex gap-4 border-b border-white/10 py-4"
              >
                <span className="mt-0.5 font-mono text-[10px] tracking-widest text-white/35">
                  0{index + 1}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[13px] font-medium">
                    <Icon className="size-3.5 text-white/45" />
                    {title}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/55">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[10.5px] tracking-[0.14em] text-white/30 uppercase">
          {texts.app.name} · v{APP_VERSION}
        </p>
      </aside>

      <main className="relative flex flex-col items-center justify-center px-6 py-14 sm:px-10">
        <div className="mb-10 lg:hidden">
          <Logo />
        </div>
        <div className="w-full max-w-[360px]">{children}</div>
        <p className="text-muted-foreground/60 absolute bottom-6 hidden text-[10.5px] tracking-[0.12em] uppercase sm:block lg:hidden">
          {texts.app.description}
        </p>
      </main>
    </div>
  );
}
