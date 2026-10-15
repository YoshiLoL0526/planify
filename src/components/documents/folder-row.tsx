"use client";

import Link from "next/link";
import { FolderIcon } from "lucide-react";

import { texts } from "@/lib/texts";
import type { ProjectFolderListItem } from "@/server/services/folders";

import { FolderActionsMenu } from "./folder-actions-menu";

/** Fila de carpeta en la página del proyecto: enlaza a su contenido y permite renombrar/eliminar. */
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
    <div className="bg-card hover:bg-accent/40 has-[a:focus-visible]:ring-ring/50 relative flex items-center gap-3 rounded-lg border p-3 transition-colors has-[a:focus-visible]:ring-3">
      <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
        <FolderIcon className="text-muted-foreground size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={`/projects/${projectId}/folders/${folder.id}`}
          className="block truncate text-sm font-medium outline-none after:absolute after:inset-0 after:rounded-lg after:content-['']"
        >
          {folder.name}
        </Link>
        <p className="text-muted-foreground truncate text-xs">
          {texts.folders.documentCount(folder.documentCount)}
        </p>
      </div>

      {canEdit ? <FolderActionsMenu folder={folder} /> : null}
    </div>
  );
}
