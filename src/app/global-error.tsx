"use client";

import { texts } from "@/lib/texts";

import "./globals.css";

/** Último recurso si falla el layout raíz: documento propio y sin dependencias. */
export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="es">
      <body className="bg-background text-foreground flex min-h-svh flex-col items-center justify-center overflow-hidden p-6 text-center font-sans antialiased">
        <title>{texts.status.errorTitle}</title>
        <div
          aria-hidden
          className="paper-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)] opacity-60"
        />
        <div className="relative flex flex-col items-center gap-4">
          <div className="bg-card flex size-14 items-center justify-center rounded-xl border text-2xl">
            !
          </div>
          <h1 className="font-heading text-[2rem] leading-[1.08] font-medium tracking-[-0.025em]">
            {texts.status.errorTitle}
          </h1>
          <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
            {texts.status.errorDescription}
          </p>
          <button
            type="button"
            onClick={() => retry()}
            className="bg-primary text-primary-foreground mt-2 rounded-md px-3 py-1.5 text-[13px] font-medium"
          >
            {texts.status.retry}
          </button>
        </div>
      </body>
    </html>
  );
}
