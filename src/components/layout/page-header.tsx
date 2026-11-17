import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Cabecera editorial común a las vistas de trabajo. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-5",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="micro text-muted-foreground/80 mb-2">{eyebrow}</p>
        ) : null}
        <h1 className="font-heading text-[2rem] leading-[1.08] font-medium tracking-[-0.025em] sm:text-[2.25rem]">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
