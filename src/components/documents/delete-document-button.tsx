"use client";

import { useState } from "react";
import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { texts } from "@/lib/texts";

import { DeleteDocumentDialog } from "./delete-document-dialog";

export function DeleteDocumentButton({
  document,
  redirectTo,
}: {
  document: { id: string; title: string };
  redirectTo?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Trash2Icon /> {texts.common.delete}
      </Button>

      {open ? (
        <DeleteDocumentDialog
          document={document}
          redirectTo={redirectTo}
          onOpenChange={(isOpen) => !isOpen && setOpen(false)}
        />
      ) : null}
    </>
  );
}
