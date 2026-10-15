import { Skeleton } from "@/components/ui/skeleton";
import { texts } from "@/lib/texts";

/** Esqueleto de la página de proyecto (cabecera y lista de documentos). */
export default function Loading() {
  return (
    <div
      className="flex flex-1 flex-col gap-6 p-6"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{texts.status.loading}</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-36" />
        </div>
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            <Skeleton className="size-9 shrink-0" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
