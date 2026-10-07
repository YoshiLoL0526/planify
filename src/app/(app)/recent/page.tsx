import type { Metadata } from "next";

import { ProjectsPage } from "@/components/projects/projects-page";
import { texts } from "@/lib/texts";

export const metadata: Metadata = {
  title: texts.views.recentTitle,
};

export default function RecentPage() {
  return (
    <ProjectsPage
      title={texts.views.recentTitle}
      view="recent"
      emptyTitle={texts.views.recentEmpty}
      emptyDescription={texts.views.recentEmptyDescription}
    />
  );
}
