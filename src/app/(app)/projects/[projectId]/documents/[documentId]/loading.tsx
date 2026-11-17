import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { texts } from "@/lib/texts";

/** Esqueleto del documento (título, editor y comentarios). */
export default function Loading() {
  return (
    <PageContainer aria-busy="true" aria-live="polite">
      <span className="sr-only">{texts.status.loading}</span>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col rounded-xl border">
          <div className="flex gap-1 border-b p-2">
            {Array.from({ length: 10 }, (_, index) => (
              <Skeleton key={index} className="size-7" />
            ))}
          </div>
          <div className="flex h-72 flex-col gap-3 p-8">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div className="hidden flex-col gap-3 lg:flex">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </PageContainer>
  );
}
