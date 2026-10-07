import { FolderPlusIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { requireSession } from "@/lib/session";
import { listFolders } from "@/server/services/folders";
import { listProjects } from "@/server/services/projects";
import { listTags } from "@/server/services/tags";
import type { ProjectView } from "@/server/validators/project";

import { NewProjectButton } from "./new-project-button";
import { ProjectGrid } from "./project-grid";

/** Vista de listado de proyectos reutilizada por inicio, favoritos, recientes, archivados, carpetas y etiquetas. */
export async function ProjectsPage({
  title,
  subtitle,
  view,
  folderId,
  tagId,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  subtitle?: string;
  view: ProjectView;
  folderId?: string;
  tagId?: string;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const session = await requireSession();

  const [page, folders, tags] = await Promise.all([
    listProjects(session.user.id, { view, folderId, tagId }),
    listFolders(session.user.id),
    listTags(session.user.id),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">{title}</h1>
          {subtitle ? (
            <p className="text-muted-foreground text-sm">{subtitle}</p>
          ) : null}
        </div>
        <NewProjectButton folders={folders} tags={tags} />
      </div>

      {page.items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full">
              <FolderPlusIcon className="text-muted-foreground size-6" />
            </div>
            <h2 className="font-heading text-lg font-medium">{emptyTitle}</h2>
            <p className="text-muted-foreground max-w-md text-sm">
              {emptyDescription}
            </p>
            <NewProjectButton folders={folders} tags={tags} variant="outline" />
          </CardContent>
        </Card>
      ) : (
        <ProjectGrid
          initialItems={page.items}
          initialNextCursor={page.nextCursor}
          view={view}
          folderId={folderId}
          tagId={tagId}
          folders={folders}
          tags={tags}
        />
      )}
    </div>
  );
}
