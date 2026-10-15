import Link from "next/link";
import { notFound } from "next/navigation";
import { FilePlusIcon, Share2Icon } from "lucide-react";

import { DocumentList } from "@/components/documents/document-list";
import { FolderRow } from "@/components/documents/folder-row";
import { NewDocumentButton } from "@/components/documents/new-document-button";
import { NewFolderButton } from "@/components/documents/new-folder-button";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { FavoriteButton } from "@/components/projects/favorite-button";
import { ProjectActionsMenu } from "@/components/projects/project-actions-menu";
import { ProjectShortcuts } from "@/components/projects/project-shortcuts";
import { TouchProject } from "@/components/projects/touch-project";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelative } from "@/lib/dates";
import { requireSession } from "@/lib/session";
import { texts } from "@/lib/texts";
import { AppError } from "@/server/errors";
import { listDocuments } from "@/server/services/documents";
import { listProjectFolders } from "@/server/services/folders";
import { getProjectView } from "@/server/services/projects";
import { listTags } from "@/server/services/tags";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await requireSession();

  const project = await getProjectView(session.user.id, projectId).catch(
    (error: unknown) => {
      if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
      throw error;
    },
  );

  const [folders, tags, documents] = await Promise.all([
    listProjectFolders(session.user.id, projectId),
    listTags(session.user.id),
    // La página del proyecto muestra la raíz; cada carpeta tiene su vista.
    listDocuments(session.user.id, projectId, null),
  ]);

  const folderOptions = folders.map((folder) => ({
    id: folder.id,
    name: folder.name,
  }));

  const projectTags = project.tagIds
    .map((tagId) => tags.find((tag) => tag.id === tagId))
    .filter((tag): tag is (typeof tags)[number] => Boolean(tag));

  const canEdit = project.status === "ACTIVE" && project.role !== "VIEWER";
  const isEmpty = folders.length === 0 && project.documentCount === 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <TouchProject projectId={project.id} />
      {canEdit ? <ProjectShortcuts projectId={project.id} /> : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <Breadcrumbs
            items={[
              { label: texts.nav.home, href: "/" },
              { label: project.name },
            ]}
          />

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold">
              {project.name}
            </h1>
            <Badge variant="secondary">{texts.roles[project.role]}</Badge>
            {project.status === "ARCHIVED" ? (
              <Badge variant="outline">{texts.projects.archivedBadge}</Badge>
            ) : null}
          </div>

          {project.description ? (
            <p className="text-muted-foreground max-w-2xl text-sm">
              {project.description}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {projectTags.map((tag) => (
              <Link key={tag.id} href={`/tags/${tag.id}`}>
                <Badge variant="outline" className="hover:bg-muted">
                  {tag.name}
                </Badge>
              </Link>
            ))}
            <span className="text-muted-foreground text-xs">
              {texts.projects.documents(project.documentCount)} ·{" "}
              {formatRelative(project.updatedAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {project.role === "OWNER" ? (
            <Link
              href={`/projects/${project.id}/settings`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Share2Icon />
              {texts.sharing.title}
            </Link>
          ) : null}
          <FavoriteButton projectId={project.id} favorite={project.favorite} />
          <ProjectActionsMenu
            project={project}
            tags={tags}
            trigger="button"
            redirectAfterDelete="/"
          />
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-medium">
            {texts.documents.title}
          </h2>
          {canEdit ? (
            <div className="flex items-center gap-2">
              <NewFolderButton projectId={project.id} />
              <NewDocumentButton projectId={project.id} />
            </div>
          ) : null}
        </div>

        {project.status === "ARCHIVED" ? (
          <p className="bg-muted text-muted-foreground rounded-md px-3 py-2 text-sm">
            {texts.documents.archivedNotice}
          </p>
        ) : null}

        {isEmpty ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="bg-muted flex size-12 items-center justify-center rounded-full">
                <FilePlusIcon className="text-muted-foreground size-6" />
              </div>
              <h3 className="font-heading text-base font-medium">
                {texts.documents.empty}
              </h3>
              <p className="text-muted-foreground max-w-md text-sm">
                {texts.documents.emptyDescription}
              </p>
              {canEdit ? <NewDocumentButton projectId={project.id} /> : null}
            </CardContent>
          </Card>
        ) : (
          <>
            {folders.length > 0 ? (
              <div className="flex flex-col gap-2">
                {folders.map((folder) => (
                  <FolderRow
                    key={folder.id}
                    folder={folder}
                    projectId={project.id}
                    canEdit={canEdit}
                  />
                ))}
              </div>
            ) : null}

            {documents.length === 0 ? (
              folders.length > 0 ? (
                <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
                  {texts.documents.emptyRoot}
                </p>
              ) : null
            ) : (
              <DocumentList
                documents={documents}
                projectId={project.id}
                canEdit={canEdit}
                folders={folderOptions}
                currentFolderId={null}
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}
