"use client";

import Link from "next/link";
import { FolderIcon } from "lucide-react";

import { texts } from "@/lib/texts";
import type { ProjectFolderListItem } from "@/server/services/folders";

import { FolderActionsMenu } from "./folder-actions-menu";

/** Fila de carpeta: enlaza a su contenido y permite renombrar/eliminar. */
export function FolderRow({
  folder,
  projectId,
  canEdit,
}: {
  folder: ProjectFolderListItem;
  projectId: string;
  canEdit: boolean;
}) {
  return (
    <div className="group/row hover:bg-muted/40 has-[a:focus-visible]:bg-muted/40 relative flex items-center gap-3 px-4 py-3 transition-colors">
      <div className="bg-muted/50 flex size-8 shrink-0 items-center justify-center rounded-md border">
        <FolderIcon className="text-muted-foreground size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={`/projects/${projectId}/folders/${folder.id}`}
          className="block truncate text-[13.5px] font-medium outline-none after:absolute after:inset-0 after:content-['']"
        >
          {folder.name}
        </Link>
      </div>

      <span className="text-muted-foreground hidden text-[10.5px] font-medium tracking-[0.1em] uppercase tabular-nums sm:block">
        {texts.folders.documentCount(folder.documentCount)}
      </span>

      {canEdit ? (
        <div className="relative z-10">
          <FolderActionsMenu folder={folder} />
        </div>
      ) : null}
    </div>
  );
}
