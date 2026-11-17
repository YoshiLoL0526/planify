import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { texts } from "@/lib/texts";

/** Esqueleto de la página de proyecto (cabecera y lista de documentos). */
export default function Loading() {
  return (
    <PageContainer aria-busy="true" aria-live="polite">
      <span className="sr-only">{texts.status.loading}</span>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-3 w-64" />
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b pb-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-36" />
        </div>
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-xl border px-4 py-3"
          >
            <Skeleton className="size-8 shrink-0" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
