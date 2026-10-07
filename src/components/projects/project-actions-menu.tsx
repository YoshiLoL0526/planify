"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { texts } from "@/lib/texts";
import { unarchiveProjectAction } from "@/server/actions/projects";

import { ArchiveProjectDialog } from "./archive-project-dialog";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { ProjectFormDialog } from "./project-form-dialog";
import type { Option, ProjectMenuTarget } from "./types";

export function ProjectActionsMenu({
  project,
  folders,
  tags,
  trigger = "icon",
  redirectAfterDelete,
}: {
  project: ProjectMenuTarget;
  folders: Option[];
  tags: Option[];
  trigger?: "icon" | "button";
  redirectAfterDelete?: string;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const isOwner = project.role === "OWNER";

  async function handleUnarchive() {
    const result = await unarchiveProjectAction({ projectId: project.id });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(texts.projects.unarchived);
    router.refresh();
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
              />
            ) : (
              <Button variant="outline" size="sm" />
            )
          }
        >
          {trigger === "icon" ? <MoreHorizontalIcon /> : texts.common.actions}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <PencilIcon /> {texts.projects.actions.edit}
          </DropdownMenuItem>

          {isOwner && project.status === "ACTIVE" ? (
            <DropdownMenuItem onClick={() => setArchiveOpen(true)}>
              <ArchiveIcon /> {texts.projects.actions.archive}
            </DropdownMenuItem>
          ) : null}

          {isOwner && project.status === "ARCHIVED" ? (
            <DropdownMenuItem onClick={handleUnarchive}>
              <ArchiveRestoreIcon /> {texts.projects.actions.unarchive}
            </DropdownMenuItem>
          ) : null}

          {isOwner ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2Icon /> {texts.projects.actions.delete}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {editOpen ? (
        <ProjectFormDialog
          mode="edit"
          onOpenChange={(open) => !open && setEditOpen(false)}
          project={project}
          folders={folders}
          tags={tags}
        />
      ) : null}

      {archiveOpen ? (
        <ArchiveProjectDialog
          project={project}
          onOpenChange={(open) => !open && setArchiveOpen(false)}
        />
      ) : null}

      {deleteOpen ? (
        <DeleteProjectDialog
          project={project}
          redirectTo={redirectAfterDelete}
          onOpenChange={(open) => !open && setDeleteOpen(false)}
        />
      ) : null}
    </>
  );
}
