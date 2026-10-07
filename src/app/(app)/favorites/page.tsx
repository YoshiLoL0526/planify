import type { Metadata } from "next";

import { ProjectsPage } from "@/components/projects/projects-page";
import { texts } from "@/lib/texts";

export const metadata: Metadata = {
  title: texts.views.favoritesTitle,
};

export default function FavoritesPage() {
  return (
    <ProjectsPage
      title={texts.views.favoritesTitle}
      view="favorites"
      emptyTitle={texts.views.favoritesEmpty}
      emptyDescription={texts.views.favoritesEmptyDescription}
    />
  );
}
