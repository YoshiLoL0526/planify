import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Ancho de lectura y ritmo vertical comunes a las vistas de trabajo.
 * Evita que las listas se estiren de lado a lado en pantallas grandes.
 */
export function PageContainer({
  children,
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "page-enter mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-8 px-5 py-7 sm:px-7 lg:px-10 lg:py-10",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
