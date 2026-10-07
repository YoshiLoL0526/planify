import type { DocumentListItem } from "@/server/services/documents";

import { DocumentRow } from "./document-row";

export function DocumentList({
  documents,
  projectId,
  canEdit,
}: {
  documents: DocumentListItem[];
  projectId: string;
  canEdit: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      {documents.map((document) => (
        <DocumentRow
          key={document.id}
          document={document}
          projectId={projectId}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
}
