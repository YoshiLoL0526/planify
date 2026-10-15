"use client";

import { useState } from "react";
import { LinkIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react";
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

/** Acciones secundarias del documento; la eliminación queda fuera de la vista principal. */
export function DocumentActionsMenu({
  document,
  canEdit,
  redirectTo,
}: {
  document: { id: string; title: string };
  canEdit: boolean;
  redirectTo?: string;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);

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
    </>
  );
}
