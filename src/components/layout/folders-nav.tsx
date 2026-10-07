"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FolderIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
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
  createFolderAction,
  deleteFolderAction,
  renameFolderAction,
} from "@/server/actions/folders";

export type FolderNavItem = { id: string; name: string; projectCount: number };

export function FoldersNav({ folders }: { folders: FolderNavItem[] }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FolderNavItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FolderNavItem | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeletePending(true);
    const result = await deleteFolderAction({ id: deleteTarget.id });
    setDeletePending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(texts.folders.deleted);
    setDeleteTarget(null);
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between py-1 pr-1 pl-3">
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {texts.folders.title}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={texts.folders.new}
          onClick={() => setCreateOpen(true)}
        >
          <PlusIcon />
        </Button>
      </div>

      {folders.length === 0 ? (
        <p className="text-muted-foreground/70 px-3 pb-1 text-xs">
          {texts.folders.empty}
        </p>
      ) : (
        folders.map((folder) => (
          <div key={folder.id} className="group/folder flex items-center">
            <Link
              href={`/folders/${folder.id}`}
              className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex min-w-0 flex-1 items-center gap-2 rounded-md px-3 py-1.5 text-sm"
            >
              <FolderIcon className="text-muted-foreground size-4 shrink-0" />
              <span className="truncate">{folder.name}</span>
              <span className="text-muted-foreground ml-auto text-xs">
                {folder.projectCount}
              </span>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`${texts.common.actions}: ${folder.name}`}
                className="text-muted-foreground hover:bg-sidebar-accent mr-1 rounded-md p-1 opacity-0 outline-none group-hover/folder:opacity-100 focus-visible:opacity-100"
              >
                <MoreHorizontalIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuItem onClick={() => setRenameTarget(folder)}>
                  <PencilIcon /> {texts.common.rename}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteTarget(folder)}
                >
                  <Trash2Icon /> {texts.common.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))
      )}

      {createOpen ? (
        <NameDialog
          onOpenChange={(open) => !open && setCreateOpen(false)}
          title={texts.folders.new}
          label={texts.folders.name}
          submitLabel={texts.folders.create}
          onSubmit={async (name) => {
            const result = await createFolderAction({ name });
            if (!result.ok) return { ok: false, error: result.error };
            toast.success(texts.folders.created);
            return { ok: true };
          }}
        />
      ) : null}

      {renameTarget ? (
        <NameDialog
          onOpenChange={(open) => !open && setRenameTarget(null)}
          title={texts.folders.rename}
          label={texts.folders.name}
          initialValue={renameTarget.name}
          submitLabel={texts.common.save}
          onSubmit={async (name) => {
            const result = await renameFolderAction({
              id: renameTarget.id,
              name,
            });
            if (!result.ok) return { ok: false, error: result.error };
            toast.success(texts.folders.renamed);
            return { ok: true };
          }}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title={texts.folders.delete}
          description={texts.folders.deleteDescription(deleteTarget.name)}
          confirmLabel={texts.common.delete}
          pending={deletePending}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  );
}
