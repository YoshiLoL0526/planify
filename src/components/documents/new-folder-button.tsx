"use client";

import { useState } from "react";
import { FolderPlusIcon } from "lucide-react";
import { toast } from "sonner";

import { NameDialog } from "@/components/organization/name-dialog";
import { Button } from "@/components/ui/button";
import { texts } from "@/lib/texts";
import { createFolderAction } from "@/server/actions/folders";

/** Crear una carpeta dentro del proyecto (RF-301). */
export function NewFolderButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FolderPlusIcon /> {texts.folders.new}
      </Button>

      {open ? (
        <NameDialog
          onOpenChange={(isOpen) => !isOpen && setOpen(false)}
          title={texts.folders.new}
          label={texts.folders.name}
          submitLabel={texts.folders.create}
          onSubmit={async (name) => {
            const result = await createFolderAction({ projectId, name });
            if (!result.ok) return { ok: false, error: result.error };
            toast.success(texts.folders.created);
            return { ok: true };
          }}
        />
      ) : null}
    </>
  );
}
