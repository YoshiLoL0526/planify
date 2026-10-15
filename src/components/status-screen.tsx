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
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 py-16 text-center">
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground size-6" />
      </div>
      <h1 className="font-heading text-xl font-semibold">{title}</h1>
      <p className="text-muted-foreground max-w-md text-sm">{description}</p>
      {children ? (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {children}
        </div>
      ) : null}
    </div>
  );
}
