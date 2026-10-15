import { Skeleton } from "@/components/ui/skeleton";
import { texts } from "@/lib/texts";

/** Esqueleto de los listados de proyectos (inicio, favoritos, carpetas…). */
export default function Loading() {
  return (
    <div
      className="flex flex-1 flex-col gap-6 p-6"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{texts.status.loading}</span>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-8 w-36" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="ring-foreground/10 flex flex-col gap-3 rounded-xl p-4 ring-1"
          >
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
