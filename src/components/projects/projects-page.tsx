import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireSession } from "@/lib/session";
import { listProjects } from "@/server/services/projects";
import { listTags } from "@/server/services/tags";
import type { ProjectView } from "@/server/validators/project";

import { NewProjectButton } from "./new-project-button";
import { ProjectGrid } from "./project-grid";

/** Vista de listado de proyectos reutilizada por inicio, favoritos, recientes, archivados y etiquetas. */
export async function ProjectsPage({
  title,
  eyebrow,
  subtitle,
  view,
  tagId,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  view: ProjectView;
  tagId?: string;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const session = await requireSession();

  const [page, tags] = await Promise.all([
    listProjects(session.user.id, { view, tagId }),
    listTags(session.user.id),
  ]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={subtitle}
        actions={<NewProjectButton tags={tags} />}
      />

      {page.items.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription}>
          <NewProjectButton tags={tags} variant="outline" />
        </EmptyState>
      ) : (
        <ProjectGrid
          initialItems={page.items}
          initialNextCursor={page.nextCursor}
          view={view}
          tagId={tagId}
          tags={tags}
        />
      )}
    </PageContainer>
  );
}
