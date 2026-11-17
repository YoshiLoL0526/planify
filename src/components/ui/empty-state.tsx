import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** Plano esquemático: el detalle que distingue los estados vacíos del resto. */
function BlueprintArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 132 96"
      fill="none"
      aria-hidden
      className={cn("text-primary/30", className)}
    >
      <path
        d="M8 84h116"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 6"
        strokeLinecap="round"
      />
      <rect
        x="42"
        y="16"
        width="50"
        height="62"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M42 29h50M51 40h32M51 49h24M51 58h28M51 67h18"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M99 12v18M90 21h18"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeDasharray="2 3"
        strokeLinecap="round"
      />
      <path
        d="m112 8 1.9 5.1L119 15l-5.1 1.9L112 22l-1.9-5.1L105 15l5.1-1.9z"
        fill="currentColor"
      />
      <circle cx="26" cy="30" r="1.6" fill="currentColor" opacity="0.7" />
      <circle cx="26" cy="48" r="1.6" fill="currentColor" opacity="0.4" />
      <circle cx="26" cy="66" r="1.6" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16 text-center sm:py-20",
        className,
      )}
    >
      <div
        aria-hidden
        className="paper-grid absolute inset-x-0 top-0 h-56 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)] opacity-70"
      />
      <div className="relative flex flex-col items-center gap-5">
        {Icon ? (
          <div className="bg-card flex size-14 items-center justify-center rounded-xl border shadow-[0_1px_2px_rgb(20_20_25/0.04)]">
            <Icon className="text-primary/70 size-6" />
          </div>
        ) : (
          <BlueprintArt className="text-primary/35 h-24 w-auto" />
        )}
        <div className="space-y-1.5">
          <h2 className="font-heading text-xl font-medium tracking-[-0.01em]">
            {title}
          </h2>
          <p className="text-muted-foreground mx-auto max-w-sm text-sm leading-relaxed">
            {description}
          </p>
        </div>
        {children ? <div className="mt-1">{children}</div> : null}
      </div>
    </div>
  );
}
