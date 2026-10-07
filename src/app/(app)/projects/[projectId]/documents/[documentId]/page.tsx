import Link from "next/link";
import { notFound } from "next/navigation";
import { FileTextIcon, ShapesIcon } from "lucide-react";

import { CommentsSidebar } from "@/components/comments/comments-sidebar";
import { DeleteDocumentButton } from "@/components/documents/delete-document-button";
import { EditableTitle } from "@/components/documents/editable-title";
import { DiagramEditor } from "@/components/diagram/diagram-editor";
import { NoteEditor } from "@/components/editor/note-editor";
import { TouchProject } from "@/components/projects/touch-project";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/dates";
import { requireSession } from "@/lib/session";
import { texts } from "@/lib/texts";
import { AppError } from "@/server/errors";
import { listThreads } from "@/server/services/comments";
import { getDocumentView } from "@/server/services/documents";
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

  const [threads, memberList] = await Promise.all([
    listThreads(session.user.id, documentId, { status: "all" }),
    listMembers(session.user.id, projectId),
  ]);
  const mentionMembers = memberList.map((member) => ({
    id: member.userId,
    name: member.name,
  }));

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <TouchProject projectId={document.projectId} />

      <nav className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
        <Link href="/" className="hover:underline">
          {texts.nav.home}
        </Link>
        <span aria-hidden>/</span>
        <Link
          href={`/projects/${document.projectId}`}
          className="hover:underline"
        >
          {document.projectName}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-foreground truncate">{document.title}</span>
      </nav>

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

        {canEdit ? (
          <DeleteDocumentButton
            document={{ id: document.id, title: document.title }}
            redirectTo={`/projects/${document.projectId}`}
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col">
          {document.type === "NOTE" ? (
            <NoteEditor
              key={`${document.id}:${document.revision}`}
              documentId={document.id}
              projectId={document.projectId}
              initialContent={document.noteContent}
              initialRevision={document.revision}
              canEdit={canEdit}
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

        <CommentsSidebar
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
