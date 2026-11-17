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
            className="text-muted-foreground/70 hover:text-foreground relative z-10"
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
      <div className="group/row bg-card hover:border-foreground/20 relative flex flex-col overflow-hidden rounded-xl border shadow-[0_1px_2px_rgb(20_20_25/0.04)] transition-[border-color,box-shadow] duration-200 hover:shadow-[0_4px_16px_rgb(20_20_25/0.06)]">
        <div className="bg-muted/25 flex aspect-[16/10] items-center justify-center overflow-hidden border-b">
          {document.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={document.thumbnailUrl}
              alt=""
              className="size-full bg-white object-contain p-2"
            />
          ) : document.excerpt ? (
            <p className="text-muted-foreground line-clamp-6 h-full w-full p-3.5 text-xs leading-relaxed">
              {document.excerpt}
            </p>
          ) : (
            <Icon className="text-muted-foreground/40 size-7" />
          )}
        </div>
        <div className="flex items-start gap-2.5 p-3.5">
          <Icon className="text-muted-foreground/70 mt-0.5 size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <Link
              href={href}
              className="block truncate text-[13.5px] font-medium outline-none after:absolute after:inset-0 after:content-['']"
            >
              {document.title}
            </Link>
            <p className="text-muted-foreground mt-0.5 truncate text-[11.5px]">
              {meta}
            </p>
          </div>
          {menu}
        </div>
        {dialogs}
      </div>
    );
  }

  return (
    <div className="group/row hover:bg-muted/40 has-[a:focus-visible]:bg-muted/40 relative flex items-center gap-3 px-4 py-3 transition-colors">
      {document.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={document.thumbnailUrl}
          alt=""
          className="h-8 w-11 shrink-0 rounded border object-cover"
        />
      ) : (
        <div className="bg-muted/50 flex size-8 shrink-0 items-center justify-center rounded-md border">
          <Icon className="text-muted-foreground size-4" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <Link
          href={href}
          className="block truncate text-[13.5px] font-medium outline-none after:absolute after:inset-0 after:content-['']"
        >
          {document.title}
        </Link>
        <p className="text-muted-foreground mt-0.5 truncate text-[11.5px]">
          {typeLabel} · {texts.documents.author(document.authorName)}
        </p>
      </div>

      <span className="text-muted-foreground hidden text-[10.5px] font-medium tracking-[0.08em] uppercase tabular-nums sm:block">
        <RelativeDate isoDate={document.updatedAt} />
      </span>

      <div className="opacity-60 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100">
        {menu}
      </div>
      {dialogs}
    </div>
  );
}
