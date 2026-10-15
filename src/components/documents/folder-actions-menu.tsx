"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/organization/confirm-dialog";
import { NameDialog } from "@/components/organization/name-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { texts } from "@/lib/texts";
import {
  deleteFolderAction,
  renameFolderAction,
} from "@/server/actions/folders";

/** Acciones de una carpeta del proyecto: renombrar y eliminar (RF-301). */
export function FolderActionsMenu({
  folder,
  trigger = "icon",
  redirectAfterDelete,
}: {
  folder: { id: string; name: string };
  trigger?: "icon" | "button";
  /** Ruta a la que ir tras eliminar (p. ej., la página del proyecto). */
  redirectAfterDelete?: string;
}) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  async function handleDelete() {
    setDeletePending(true);
    const result = await deleteFolderAction({ folderId: folder.id });
    setDeletePending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(texts.folders.deleted);
    setDeleteOpen(false);
    if (redirectAfterDelete) {
      router.push(redirectAfterDelete);
    } else {
      router.refresh();
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            trigger === "icon" ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={texts.common.actions}
                className="relative z-10"
              />
            ) : (
              <Button variant="outline" size="sm" />
            )
          }
        >
          {trigger === "icon" ? <MoreHorizontalIcon /> : texts.common.actions}
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

      {renameOpen ? (
        <NameDialog
          onOpenChange={(open) => !open && setRenameOpen(false)}
          title={texts.folders.rename}
          label={texts.folders.name}
          initialValue={folder.name}
          submitLabel={texts.common.save}
          onSubmit={async (name) => {
            const result = await renameFolderAction({
              folderId: folder.id,
              name,
            });
            if (!result.ok) return { ok: false, error: result.error };
            toast.success(texts.folders.renamed);
            return { ok: true };
          }}
        />
      ) : null}

      {deleteOpen ? (
        <ConfirmDialog
          onOpenChange={(open) => !open && setDeleteOpen(false)}
          title={texts.folders.delete}
          description={texts.folders.deleteDescription(folder.name)}
          confirmLabel={texts.common.delete}
          pending={deletePending}
          onConfirm={handleDelete}
        />
      ) : null}
    </>
  );
}
