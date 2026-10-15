"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileTextIcon,
  FolderInputIcon,
  MoreHorizontalIcon,
  PencilIcon,
  ShapesIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { NameDialog } from "@/components/organization/name-dialog";
import { RelativeDate } from "@/components/relative-date";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { texts } from "@/lib/texts";
import { renameDocumentAction } from "@/server/actions/documents";
import type { DocumentListItem } from "@/server/services/documents";

import { DeleteDocumentDialog } from "./delete-document-dialog";
import { MoveDocumentDialog } from "./move-document-dialog";

export function DocumentRow({
  document,
  projectId,
  canEdit,
  view = "list",
  folders = [],
  currentFolderId = null,
}: {
  document: DocumentListItem;
  projectId: string;
  canEdit: boolean;
  view?: "list" | "grid";
  /** Carpetas del proyecto para el movimiento; vacío = función oculta. */
  folders?: { id: string; name: string }[];
  /** Carpeta donde está el documento ahora (`null` = raíz). */
  currentFolderId?: string | null;
}) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);

  const Icon = document.type === "NOTE" ? FileTextIcon : ShapesIcon;
  const typeLabel =
    document.type === "NOTE" ? texts.documents.note : texts.documents.diagram;

  const href = `/projects/${projectId}/documents/${document.id}`;
  const meta = (
    <>
      {typeLabel} · {texts.documents.author(document.authorName)} ·{" "}
      <RelativeDate isoDate={document.updatedAt} />
    </>
  );

  const menu = canEdit ? (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={texts.common.actions}
            className="relative z-10"
          />
        }
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => setRenameOpen(true)}>
          <PencilIcon /> {texts.common.rename}
        </DropdownMenuItem>
        {folders.length > 0 ? (
          <DropdownMenuItem onClick={() => setMoveOpen(true)}>
            <FolderInputIcon /> {texts.documents.move}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2Icon /> {texts.common.delete}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  const dialogs = (
    <>
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

      {moveOpen ? (
        <MoveDocumentDialog
          document={{ id: document.id, title: document.title }}
          folders={folders}
          currentFolderId={currentFolderId}
          onOpenChange={(open) => !open && setMoveOpen(false)}
        />
      ) : null}
    </>
  );

  if (view === "grid") {
    return (
      <div className="bg-card hover:ring-foreground/20 has-[a:focus-visible]:ring-ring/50 ring-foreground/10 relative flex flex-col overflow-hidden rounded-xl ring-1 transition-shadow hover:shadow-md has-[a:focus-visible]:ring-3">
        <div className="bg-muted/40 flex aspect-[16/10] items-center justify-center overflow-hidden border-b">
          {document.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={document.thumbnailUrl}
              alt=""
              className="size-full bg-white object-contain p-2"
            />
          ) : document.excerpt ? (
            <p className="text-muted-foreground line-clamp-6 h-full w-full p-3 text-xs leading-relaxed">
              {document.excerpt}
            </p>
          ) : (
            <Icon className="text-muted-foreground/60 size-8" />
          )}
        </div>
        <div className="flex items-start gap-2 p-3">
          <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <Link
              href={href}
              className="block truncate text-sm font-medium outline-none after:absolute after:inset-0 after:content-['']"
            >
              {document.title}
            </Link>
            <p className="text-muted-foreground truncate text-xs">{meta}</p>
          </div>
          {menu}
        </div>
        {dialogs}
      </div>
    );
  }

  return (
    <div className="bg-card hover:bg-accent/40 has-[a:focus-visible]:ring-ring/50 relative flex items-center gap-3 rounded-lg border p-3 transition-colors has-[a:focus-visible]:ring-3">
      {document.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={document.thumbnailUrl}
          alt=""
          className="h-12 w-16 shrink-0 rounded-md border object-cover"
        />
      ) : (
        <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
          <Icon className="text-muted-foreground size-4" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <Link
          href={href}
          className="block truncate text-sm font-medium outline-none after:absolute after:inset-0 after:rounded-lg after:content-['']"
        >
          {document.title}
        </Link>
        <p className="text-muted-foreground truncate text-xs">{meta}</p>
      </div>

      {menu}
      {dialogs}
    </div>
  );
}
