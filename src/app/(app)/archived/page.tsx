import type { Metadata } from "next";

import { ProjectsPage } from "@/components/projects/projects-page";
import { texts } from "@/lib/texts";

export const metadata: Metadata = {
  title: texts.views.archivedTitle,
};

export default function ArchivedPage() {
  return (
    <ProjectsPage
      title={texts.views.archivedTitle}
      view="archived"
      emptyTitle={texts.views.archivedEmpty}
      emptyDescription={texts.views.archivedEmptyDescription}
    />
  );
}
