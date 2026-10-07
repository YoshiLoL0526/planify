import Link from "next/link";
import { notFound } from "next/navigation";
import { FileTextIcon, ShapesIcon } from "lucide-react";

import { DeleteDocumentButton } from "@/components/documents/delete-document-button";
import { EditableTitle } from "@/components/documents/editable-title";
import { TouchProject } from "@/components/projects/touch-project";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelative } from "@/lib/dates";
import { requireSession } from "@/lib/session";
import { texts } from "@/lib/texts";
import { AppError } from "@/server/errors";
import { getDocumentView } from "@/server/services/documents";

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

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="bg-muted flex size-12 items-center justify-center rounded-full">
            <Icon className="text-muted-foreground size-6" />
          </div>
          <h2 className="font-heading text-lg font-medium">
            {document.type === "NOTE"
              ? texts.documents.placeholderNoteTitle
              : texts.documents.placeholderDiagramTitle}
          </h2>
          <p className="text-muted-foreground max-w-md text-sm">
            {document.type === "NOTE"
              ? texts.documents.placeholderNoteDescription
              : texts.documents.placeholderDiagramDescription}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
