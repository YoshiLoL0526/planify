import { Skeleton } from "@/components/ui/skeleton";
import { texts } from "@/lib/texts";

/** Esqueleto del documento (título y área del editor). */
export default function Loading() {
  return (
    <div
      className="flex flex-1 flex-col gap-6 p-6"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{texts.status.loading}</span>
      <Skeleton className="h-4 w-56" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="flex flex-col rounded-lg border">
        <div className="flex gap-1 border-b p-2">
          {Array.from({ length: 10 }, (_, index) => (
            <Skeleton key={index} className="size-7" />
          ))}
        </div>
        <div className="flex h-56 flex-col gap-3 p-5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}
