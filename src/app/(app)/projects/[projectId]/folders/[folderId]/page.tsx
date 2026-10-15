import { notFound } from "next/navigation";
import { FilePlusIcon } from "lucide-react";

import { DocumentList } from "@/components/documents/document-list";
import { FolderActionsMenu } from "@/components/documents/folder-actions-menu";
import { NewDocumentButton } from "@/components/documents/new-document-button";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { TouchProject } from "@/components/projects/touch-project";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="flex flex-1 flex-col gap-6 p-6">
      <TouchProject projectId={project.id} />

      <Breadcrumbs
        items={[
          { label: texts.nav.home, href: "/" },
          { label: project.name, href: `/projects/${project.id}` },
          { label: folder.name },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold">{folder.name}</h1>
          <Badge variant="secondary">
            {texts.folders.documentCount(documents.length)}
          </Badge>
          {project.status === "ARCHIVED" ? (
            <Badge variant="outline">{texts.projects.archivedBadge}</Badge>
          ) : null}
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

      {project.status === "ARCHIVED" ? (
        <p className="bg-muted text-muted-foreground rounded-md px-3 py-2 text-sm">
          {texts.documents.archivedNotice}
        </p>
      ) : null}

      {documents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full">
              <FilePlusIcon className="text-muted-foreground size-6" />
            </div>
            <h2 className="font-heading text-base font-medium">
              {texts.folders.emptyFolder}
            </h2>
            <p className="text-muted-foreground max-w-md text-sm">
              {texts.folders.emptyFolderDescription}
            </p>
            {canEdit ? (
              <NewDocumentButton projectId={project.id} folderId={folder.id} />
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <DocumentList
          documents={documents}
          projectId={project.id}
          canEdit={canEdit}
          folders={folderOptions}
          currentFolderId={folder.id}
        />
      )}
    </div>
  );
}
