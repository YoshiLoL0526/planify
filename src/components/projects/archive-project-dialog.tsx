"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/organization/confirm-dialog";
import { texts } from "@/lib/texts";
import { archiveProjectAction } from "@/server/actions/projects";

export function ArchiveProjectDialog({
  project,
  onOpenChange,
}: {
  project: { id: string; name: string };
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    const result = await archiveProjectAction({ projectId: project.id });
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(texts.projects.archived);
    onOpenChange(false);
    router.refresh();
  }

  return (
    <ConfirmDialog
      onOpenChange={onOpenChange}
      title={texts.projects.archiveDialog.title}
      description={texts.projects.archiveDialog.description(project.name)}
      confirmLabel={texts.projects.archiveDialog.confirm}
      pending={pending}
      onConfirm={handleConfirm}
    />
  );
}
