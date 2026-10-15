"use client";

import { useState } from "react";
import {
  FolderInputIcon,
  LinkIcon,
  MoreHorizontalIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { copyToClipboard } from "@/components/sharing/copy-link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { texts } from "@/lib/texts";

import { DeleteDocumentDialog } from "./delete-document-dialog";
import { MoveDocumentDialog } from "./move-document-dialog";

/** Acciones secundarias del documento; la eliminación queda fuera de la vista principal. */
export function DocumentActionsMenu({
  document,
  canEdit,
  redirectTo,
  folders = [],
  currentFolderId = null,
}: {
  document: { id: string; title: string };
  canEdit: boolean;
  redirectTo?: string;
  /** Carpetas del proyecto para mover el documento; vacío = función oculta. */
  folders?: { id: string; name: string }[];
  /** Carpeta donde está el documento ahora (`null` = raíz). */
  currentFolderId?: string | null;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);

  async function handleCopyLink() {
    const ok = await copyToClipboard(
      `${window.location.origin}${window.location.pathname}`,
    );
    if (ok) {
      toast.success(texts.documents.linkCopied);
    } else {
      toast.error(texts.common.unexpectedError);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={texts.documents.actions}
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => void handleCopyLink()}>
            <LinkIcon /> {texts.documents.copyLink}
          </DropdownMenuItem>
          {canEdit && folders.length > 0 ? (
            <DropdownMenuItem onClick={() => setMoveOpen(true)}>
              <FolderInputIcon /> {texts.documents.move}
            </DropdownMenuItem>
          ) : null}
          {canEdit ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2Icon /> {texts.common.delete}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {deleteOpen ? (
        <DeleteDocumentDialog
          document={document}
          redirectTo={redirectTo}
          onOpenChange={(isOpen) => !isOpen && setDeleteOpen(false)}
        />
      ) : null}

      {moveOpen ? (
        <MoveDocumentDialog
          document={document}
          folders={folders}
          currentFolderId={currentFolderId}
          onOpenChange={(isOpen) => !isOpen && setMoveOpen(false)}
        />
      ) : null}
    </>
  );
}
