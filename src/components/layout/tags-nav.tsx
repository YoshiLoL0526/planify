"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HashIcon,
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
  createTagAction,
  deleteTagAction,
  renameTagAction,
} from "@/server/actions/tags";

export type TagNavItem = { id: string; name: string; projectCount: number };

export function TagsNav({ tags }: { tags: TagNavItem[] }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<TagNavItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TagNavItem | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeletePending(true);
    const result = await deleteTagAction({ id: deleteTarget.id });
    setDeletePending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(texts.tags.deleted);
    setDeleteTarget(null);
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between py-1 pr-1 pl-3">
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {texts.tags.title}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={texts.tags.new}
          onClick={() => setCreateOpen(true)}
        >
          <PlusIcon />
        </Button>
      </div>

      {tags.length === 0 ? (
        <p className="text-muted-foreground/70 px-3 pb-1 text-xs">
          {texts.tags.empty}
        </p>
      ) : (
        tags.map((tag) => (
          <div key={tag.id} className="group/tag flex items-center">
            <Link
              href={`/tags/${tag.id}`}
              className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex min-w-0 flex-1 items-center gap-2 rounded-md px-3 py-1.5 text-sm"
            >
              <HashIcon className="text-muted-foreground size-4 shrink-0" />
              <span className="truncate">{tag.name}</span>
              <span className="text-muted-foreground ml-auto text-xs">
                {tag.projectCount}
              </span>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`${texts.common.actions}: ${tag.name}`}
                className="text-muted-foreground hover:bg-sidebar-accent mr-1 rounded-md p-1 opacity-0 outline-none group-hover/tag:opacity-100 focus-visible:opacity-100"
              >
                <MoreHorizontalIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuItem onClick={() => setRenameTarget(tag)}>
                  <PencilIcon /> {texts.common.rename}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteTarget(tag)}
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
          title={texts.tags.new}
          label={texts.tags.name}
          submitLabel={texts.tags.create}
          maxLength={50}
          onSubmit={async (name) => {
            const result = await createTagAction({ name });
            if (!result.ok) return { ok: false, error: result.error };
            toast.success(texts.tags.created);
            return { ok: true };
          }}
        />
      ) : null}

      {renameTarget ? (
        <NameDialog
          onOpenChange={(open) => !open && setRenameTarget(null)}
          title={texts.tags.rename}
          label={texts.tags.name}
          initialValue={renameTarget.name}
          submitLabel={texts.common.save}
          maxLength={50}
          onSubmit={async (name) => {
            const result = await renameTagAction({ id: renameTarget.id, name });
            if (!result.ok) return { ok: false, error: result.error };
            toast.success(texts.tags.renamed);
            return { ok: true };
          }}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title={texts.tags.delete}
          description={texts.tags.deleteDescription(deleteTarget.name)}
          confirmLabel={texts.common.delete}
          pending={deletePending}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  );
}
