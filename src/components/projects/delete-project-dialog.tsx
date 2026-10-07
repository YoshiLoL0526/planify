"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/organization/confirm-dialog";
import { texts } from "@/lib/texts";
import { deleteProjectAction } from "@/server/actions/projects";

export function DeleteProjectDialog({
  project,
  redirectTo,
  onOpenChange,
}: {
  project: { id: string; name: string };
  redirectTo?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    const result = await deleteProjectAction({
      projectId: project.id,
      confirmName: project.name,
    });
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(texts.projects.deleted);
    onOpenChange(false);
    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.refresh();
    }
  }

  return (
    <ConfirmDialog
      onOpenChange={onOpenChange}
      title={texts.projects.deleteDialog.title}
      description={texts.projects.deleteDialog.description(project.name)}
      confirmationText={project.name}
      confirmLabel={texts.projects.deleteDialog.confirm}
      pending={pending}
      onConfirm={handleConfirm}
    />
  );
}
