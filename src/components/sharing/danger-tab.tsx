"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  Loader2Icon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { ArchiveProjectDialog } from "@/components/projects/archive-project-dialog";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { Button } from "@/components/ui/button";
import { texts } from "@/lib/texts";
import { unarchiveProjectAction } from "@/server/actions/projects";

/** Zona peligrosa: archivar, desarchivar y eliminar (RF-204, RF-205). */
export function DangerTab({
  project,
}: {
  project: { id: string; name: string; status: "ACTIVE" | "ARCHIVED" };
}) {
  const router = useRouter();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleUnarchive() {
    setPending(true);
    const result = await unarchiveProjectAction({ projectId: project.id });
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(texts.projects.unarchived);
    router.refresh();
  }

  return (
    <div className="bg-card flex flex-col gap-4 rounded-lg border p-4">
      <div>
        <h2 className="font-heading text-base font-medium">
          {texts.sharing.danger.title}
        </h2>
        <p className="text-muted-foreground text-sm">
          {texts.sharing.danger.description}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {project.status === "ACTIVE" ? (
          <Button variant="outline" onClick={() => setArchiveOpen(true)}>
            <ArchiveIcon />
            {texts.sharing.danger.archive}
          </Button>
        ) : (
          <Button
            variant="outline"
            disabled={pending}
            onClick={handleUnarchive}
          >
            {pending ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <ArchiveRestoreIcon />
            )}
            {texts.sharing.danger.unarchive}
          </Button>
        )}
        <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
          <Trash2Icon />
          {texts.sharing.danger.delete}
        </Button>
      </div>

      {archiveOpen ? (
        <ArchiveProjectDialog
          project={project}
          onOpenChange={(open) => !open && setArchiveOpen(false)}
        />
      ) : null}

      {deleteOpen ? (
        <DeleteProjectDialog
          project={project}
          redirectTo="/"
          onOpenChange={(open) => !open && setDeleteOpen(false)}
        />
      ) : null}
    </div>
  );
}
