"use client";

import type { ComponentProps } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Tema claro/oscuro/sistema persistido por el navegador (clase `.dark` en <html>). */
export function ThemeProvider(
  props: ComponentProps<typeof NextThemesProvider>,
) {
  return <NextThemesProvider {...props} />;
}
