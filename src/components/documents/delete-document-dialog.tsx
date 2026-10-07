"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/organization/confirm-dialog";
import { texts } from "@/lib/texts";
import { deleteDocumentAction } from "@/server/actions/documents";

export function DeleteDocumentDialog({
  document,
  redirectTo,
  onOpenChange,
}: {
  document: { id: string; title: string };
  redirectTo?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    const result = await deleteDocumentAction({ documentId: document.id });
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(texts.documents.deleted);
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
      title={texts.documents.deleteDialog.title}
      description={texts.documents.deleteDialog.description(document.title)}
      confirmLabel={texts.documents.deleteDialog.confirm}
      pending={pending}
      onConfirm={handleConfirm}
    />
  );
}
