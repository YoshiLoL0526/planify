import { Skeleton } from "@/components/ui/skeleton";
import { texts } from "@/lib/texts";

/** Esqueleto de los listados de proyectos (inicio, favoritos, recientes, etiquetas…). */
export default function Loading() {
  return (
    <div
      className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-8 px-5 py-7 sm:px-7 lg:px-10 lg:py-10"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{texts.status.loading}</span>
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-56" />
        </div>
        <Skeleton className="h-8 w-36" />
      </div>
      <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="border-l-muted flex min-h-[176px] flex-col gap-3 rounded-xl border border-l-[3px] p-5"
          >
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="mt-auto flex justify-between border-t pt-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
