import { notFound } from "next/navigation";
import { FileTextIcon, MessageSquareIcon, ShapesIcon } from "lucide-react";

import { CommentsSection } from "@/components/comments/comments-section";
import { DocumentActionsMenu } from "@/components/documents/document-actions-menu";
import { EditableTitle } from "@/components/documents/editable-title";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DiagramEditor } from "@/components/diagram/diagram-editor";
import { NoteEditor } from "@/components/editor/note-editor";
import { TouchProject } from "@/components/projects/touch-project";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatRelative } from "@/lib/dates";
import { requireSession } from "@/lib/session";
import { texts } from "@/lib/texts";
import { AppError } from "@/server/errors";
import { listThreads } from "@/server/services/comments";
import { getDocumentView } from "@/server/services/documents";
import { listProjectFolders } from "@/server/services/folders";
import { listMembers } from "@/server/services/sharing";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ projectId: string; documentId: string }>;
}) {
  const { projectId, documentId } = await params;
  const session = await requireSession();

  const document = await getDocumentView(
    session.user.id,
    projectId,
    documentId,
  ).catch((error: unknown) => {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    throw error;
  });

  const canEdit =
    document.projectStatus === "ACTIVE" && document.role !== "VIEWER";
  const Icon = document.type === "NOTE" ? FileTextIcon : ShapesIcon;
  const typeLabel =
    document.type === "NOTE" ? texts.documents.note : texts.documents.diagram;

  const [threads, memberList, folders] = await Promise.all([
    listThreads(session.user.id, documentId, { status: "all" }),
    listMembers(session.user.id, projectId),
    listProjectFolders(session.user.id, projectId),
  ]);
  const openThreadCount = threads.filter(
    (thread) => thread.status === "OPEN",
  ).length;
  const mentionMembers = memberList.map((member) => ({
    id: member.userId,
    name: member.name,
  }));
  const folderOptions = folders.map((folder) => ({
    id: folder.id,
    name: folder.name,
  }));

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <TouchProject projectId={document.projectId} />

      <Breadcrumbs
        items={[
          { label: texts.nav.home, href: "/" },
          {
            label: document.projectName,
            href: `/projects/${document.projectId}`,
          },
          ...(document.folder
            ? [
                {
                  label: document.folder.name,
                  href: `/projects/${document.projectId}/folders/${document.folder.id}`,
                },
              ]
            : []),
          { label: document.title },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Icon className="size-3.5" /> {typeLabel}
            </Badge>
            {document.projectStatus === "ARCHIVED" ? (
              <Badge variant="outline">{texts.projects.archivedBadge}</Badge>
            ) : null}
          </div>

          <EditableTitle
            documentId={document.id}
            title={document.title}
            canEdit={canEdit}
          />

          <p className="text-muted-foreground text-xs">
            {texts.documents.author(document.authorName)} ·{" "}
            {formatRelative(document.updatedAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="#comentarios"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <MessageSquareIcon />
            {texts.comments.title}
            {openThreadCount > 0 ? (
              <Badge variant="secondary">{openThreadCount}</Badge>
            ) : null}
          </a>
          <DocumentActionsMenu
            document={{ id: document.id, title: document.title }}
            canEdit={canEdit}
            redirectTo={`/projects/${document.projectId}`}
            folders={folderOptions}
            currentFolderId={document.folder?.id ?? null}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-col">
        {document.type === "NOTE" ? (
          <NoteEditor
            key={`${document.id}:${document.revision}`}
            documentId={document.id}
            projectId={document.projectId}
            initialContent={document.noteContent}
            initialRevision={document.revision}
            canEdit={canEdit}
            canComment={document.projectStatus === "ACTIVE"}
          />
        ) : (
          <DiagramEditor
            key={`${document.id}:${document.revision}`}
            documentId={document.id}
            projectId={document.projectId}
            initialScene={document.diagramContent}
            initialThumbnailFileId={document.thumbnailFileId}
            initialRevision={document.revision}
            canEdit={canEdit}
          />
        )}
      </div>

      <div className="border-t pt-6">
        <CommentsSection
          documentId={document.id}
          initialThreads={threads}
          members={mentionMembers}
          currentUserId={session.user.id}
          role={document.role}
          canComment={document.projectStatus === "ACTIVE"}
        />
      </div>
    </div>
  );
}
