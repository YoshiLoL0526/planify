import Link from "next/link";
import { notFound } from "next/navigation";
import { ArchiveIcon, Share2Icon } from "lucide-react";

import { DocumentList } from "@/components/documents/document-list";
import { FolderRow } from "@/components/documents/folder-row";
import { NewDocumentButton } from "@/components/documents/new-document-button";
import { NewFolderButton } from "@/components/documents/new-folder-button";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { FavoriteButton } from "@/components/projects/favorite-button";
import { ProjectActionsMenu } from "@/components/projects/project-actions-menu";
import { ProjectShortcuts } from "@/components/projects/project-shortcuts";
import { TouchProject } from "@/components/projects/touch-project";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelative } from "@/lib/dates";
import { requireSession } from "@/lib/session";
import { NEUTRAL_SPINE, tagSpineColor } from "@/lib/tag-color";
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

  const spine = projectTags[0]
    ? tagSpineColor(projectTags[0].id)
    : NEUTRAL_SPINE;
  const initial = project.name.trim().charAt(0).toUpperCase();

  return (
    <PageContainer>
      <TouchProject projectId={project.id} />
      {canEdit ? <ProjectShortcuts projectId={project.id} /> : null}

      <header className="flex flex-col gap-5">
        <Breadcrumbs
          items={[
            { label: texts.nav.home, href: "/" },
            { label: project.name },
          ]}
        />

        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex min-w-0 items-start gap-4">
            <div
              aria-hidden
              style={{ borderLeftColor: spine, color: spine }}
              className="bg-card font-heading hidden size-12 shrink-0 items-center justify-center rounded-lg border border-l-[3px] text-lg font-medium sm:flex"
            >
              {initial}
            </div>

            <div className="min-w-0 space-y-2.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h1 className="font-heading text-[2rem] leading-[1.08] font-medium tracking-[-0.025em] sm:text-[2.25rem]">
                  {project.name}
                </h1>
                <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[10.5px] font-medium tracking-[0.1em] uppercase">
                  <span
                    aria-hidden
                    className="bg-muted-foreground/40 size-1 rounded-full"
                  />
                  {texts.roles[project.role]}
                </span>
                {project.status === "ARCHIVED" ? (
                  <Badge variant="outline">
                    {texts.projects.archivedBadge}
                  </Badge>
                ) : null}
              </div>

              {project.description ? (
                <p className="text-muted-foreground max-w-[62ch] text-sm leading-relaxed">
                  {project.description}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
                {projectTags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tags/${tag.id}`}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-[10.5px] font-medium tracking-[0.1em] uppercase transition-colors"
                  >
                    <span
                      aria-hidden
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ background: tagSpineColor(tag.id) }}
                    />
                    {tag.name}
                  </Link>
                ))}
                <span className="text-muted-foreground text-[10.5px] font-medium tracking-[0.1em] uppercase">
                  {texts.projects.documents(project.documentCount)} ·{" "}
                  {formatRelative(project.updatedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {project.role === "OWNER" ? (
              <Link
                href={`/projects/${project.id}/settings`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Share2Icon />
                {texts.sharing.title}
              </Link>
            ) : null}
            <FavoriteButton
              projectId={project.id}
              favorite={project.favorite}
              className="text-muted-foreground/70 hover:text-foreground"
            />
            <ProjectActionsMenu
              project={project}
              tags={tags}
              trigger="button"
              redirectAfterDelete="/"
            />
          </div>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-3">
          <div className="flex items-baseline gap-3">
            <h2 className="font-heading text-[1.35rem] leading-none font-medium tracking-[-0.015em]">
              {texts.documents.title}
            </h2>
            <span className="micro text-muted-foreground/70">
              {texts.projects.documents(project.documentCount)}
            </span>
          </div>
          {canEdit ? (
            <div className="flex items-center gap-2">
              <NewFolderButton projectId={project.id} />
              <NewDocumentButton projectId={project.id} />
            </div>
          ) : null}
        </div>

        {project.status === "ARCHIVED" ? (
          <p className="bg-muted/40 text-muted-foreground flex items-start gap-2 rounded-md border px-3.5 py-2.5 text-[13px]">
            <ArchiveIcon className="mt-0.5 size-4 shrink-0" />
            {texts.documents.archivedNotice}
          </p>
        ) : null}

        {isEmpty ? (
          <EmptyState
            title={texts.documents.empty}
            description={texts.documents.emptyDescription}
          >
            {canEdit ? <NewDocumentButton projectId={project.id} /> : null}
          </EmptyState>
        ) : (
          <>
            {folders.length > 0 ? (
              <div className="bg-card divide-y overflow-hidden rounded-xl border">
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
                <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-[13px]">
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
    </PageContainer>
  );
}
