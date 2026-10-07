"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileTextIcon,
  MoreHorizontalIcon,
  PencilIcon,
  ShapesIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { NameDialog } from "@/components/organization/name-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelative } from "@/lib/dates";
import { texts } from "@/lib/texts";
import { renameDocumentAction } from "@/server/actions/documents";
import type { DocumentListItem } from "@/server/services/documents";

import { DeleteDocumentDialog } from "./delete-document-dialog";

export function DocumentRow({
  document,
  projectId,
  canEdit,
}: {
  document: DocumentListItem;
  projectId: string;
  canEdit: boolean;
}) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const Icon = document.type === "NOTE" ? FileTextIcon : ShapesIcon;
  const typeLabel =
    document.type === "NOTE" ? texts.documents.note : texts.documents.diagram;

  return (
    <div className="bg-card flex items-center gap-3 rounded-lg border p-3">
      <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
        <Icon className="text-muted-foreground size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={`/projects/${projectId}/documents/${document.id}`}
          className="block truncate text-sm font-medium outline-none hover:underline"
        >
          {document.title}
        </Link>
        <p className="text-muted-foreground truncate text-xs">
          {typeLabel} · {texts.documents.author(document.authorName)} ·{" "}
          {formatRelative(document.updatedAt)}
        </p>
      </div>

      {canEdit ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={texts.common.actions}
              />
            }
          >
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => setRenameOpen(true)}>
              <PencilIcon /> {texts.common.rename}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2Icon /> {texts.common.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {renameOpen ? (
        <NameDialog
          onOpenChange={(open) => !open && setRenameOpen(false)}
          title={texts.documents.rename}
          label={texts.documents.renameLabel}
          initialValue={document.title}
          submitLabel={texts.common.save}
          maxLength={160}
          onSubmit={async (title) => {
            const result = await renameDocumentAction({
              documentId: document.id,
              title,
            });
            if (!result.ok) return { ok: false, error: result.error };
            toast.success(texts.documents.renamed);
            return { ok: true };
          }}
        />
      ) : null}

      {deleteOpen ? (
        <DeleteDocumentDialog
          document={{ id: document.id, title: document.title }}
          onOpenChange={(open) => !open && setDeleteOpen(false)}
        />
      ) : null}
    </div>
  );
}
