import { notFound } from "next/navigation";
import { ArchiveIcon } from "lucide-react";

import { DocumentList } from "@/components/documents/document-list";
import { FolderActionsMenu } from "@/components/documents/folder-actions-menu";
import { NewDocumentButton } from "@/components/documents/new-document-button";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { TouchProject } from "@/components/projects/touch-project";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireSession } from "@/lib/session";
import { texts } from "@/lib/texts";
import { AppError } from "@/server/errors";
import { listDocuments } from "@/server/services/documents";
import {
  getProjectFolder,
  listProjectFolders,
} from "@/server/services/folders";
import { getProjectView } from "@/server/services/projects";

/** Contenido de una carpeta del proyecto (RF-301). */
export default async function FolderPage({
  params,
}: {
  params: Promise<{ projectId: string; folderId: string }>;
}) {
  const { projectId, folderId } = await params;
  const session = await requireSession();

  const project = await getProjectView(session.user.id, projectId).catch(
    (error: unknown) => {
      if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
      throw error;
    },
  );

  const folder = await getProjectFolder(
    session.user.id,
    projectId,
    folderId,
  ).catch((error: unknown) => {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    throw error;
  });

  const [documents, folders] = await Promise.all([
    listDocuments(session.user.id, projectId, folder.id),
    listProjectFolders(session.user.id, projectId),
  ]);

  const folderOptions = folders.map((item) => ({
    id: item.id,
    name: item.name,
  }));

  const canEdit = project.status === "ACTIVE" && project.role !== "VIEWER";

  return (
    <PageContainer>
      <TouchProject projectId={project.id} />

      <header className="flex flex-col gap-5">
        <Breadcrumbs
          items={[
            { label: texts.nav.home, href: "/" },
            { label: project.name, href: `/projects/${project.id}` },
            { label: folder.name },
          ]}
        />

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="micro text-muted-foreground/80 mb-2">
              {project.name}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-[2rem] leading-[1.08] font-medium tracking-[-0.025em]">
                {folder.name}
              </h1>
              <span className="micro text-muted-foreground/70">
                {texts.folders.documentCount(documents.length)}
              </span>
              {project.status === "ARCHIVED" ? (
                <Badge variant="outline">{texts.projects.archivedBadge}</Badge>
              ) : null}
            </div>
          </div>

          {canEdit ? (
            <div className="flex items-center gap-2">
              <NewDocumentButton projectId={project.id} folderId={folder.id} />
              <FolderActionsMenu
                folder={{ id: folder.id, name: folder.name }}
                trigger="button"
                redirectAfterDelete={`/projects/${project.id}`}
              />
            </div>
          ) : null}
        </div>
      </header>

      {project.status === "ARCHIVED" ? (
        <p className="bg-muted/40 text-muted-foreground flex items-start gap-2 rounded-md border px-3.5 py-2.5 text-[13px]">
          <ArchiveIcon className="mt-0.5 size-4 shrink-0" />
          {texts.documents.archivedNotice}
        </p>
      ) : null}

      {documents.length === 0 ? (
        <EmptyState
          title={texts.folders.emptyFolder}
          description={texts.folders.emptyFolderDescription}
        >
          {canEdit ? (
            <NewDocumentButton projectId={project.id} folderId={folder.id} />
          ) : null}
        </EmptyState>
      ) : (
        <DocumentList
          documents={documents}
          projectId={project.id}
          canEdit={canEdit}
          folders={folderOptions}
          currentFolderId={folder.id}
        />
      )}
    </PageContainer>
  );
}
