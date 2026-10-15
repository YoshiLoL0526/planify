"use client";

import { texts } from "@/lib/texts";

import "./globals.css";

/** Último recurso si falla el layout raíz: documento propio y sin dependencias. */
export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="es">
      <body className="bg-background text-foreground flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center font-sans antialiased">
        <title>{texts.status.errorTitle}</title>
        <h1 className="text-xl font-semibold">{texts.status.errorTitle}</h1>
        <p className="text-muted-foreground max-w-md text-sm">
          {texts.status.errorDescription}
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="bg-primary text-primary-foreground mt-2 rounded-lg px-3 py-1.5 text-sm font-medium"
        >
          {texts.status.retry}
        </button>
      </body>
    </html>
  );
}
