import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** Pantalla centrada para estados de página (404, error…). */
export function StatusScreen({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      <div
        aria-hidden
        className="paper-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)] opacity-60"
      />
      <div className="relative flex flex-col items-center gap-4">
        <div className="bg-card flex size-14 items-center justify-center rounded-xl border shadow-[0_1px_2px_rgb(20_20_25/0.04)]">
          <Icon className="text-primary/70 size-6" />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-[2rem] leading-[1.08] font-medium tracking-[-0.025em]">
            {title}
          </h1>
          <p className="text-muted-foreground mx-auto max-w-md text-sm leading-relaxed">
            {description}
          </p>
        </div>
        {children ? (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
