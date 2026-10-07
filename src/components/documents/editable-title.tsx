"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { texts } from "@/lib/texts";
import { renameDocumentAction } from "@/server/actions/documents";

/** Título editable en línea del documento (RF-403). */
export function EditableTitle({
  documentId,
  title,
  canEdit,
}: {
  documentId: string;
  title: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [pending, startTransition] = useTransition();

  function save() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === title) {
      setValue(title);
      setEditing(false);
      return;
    }

    startTransition(async () => {
      const result = await renameDocumentAction({
        documentId,
        title: trimmed,
      });
      if (!result.ok) {
        toast.error(result.error);
        setValue(title);
      } else {
        toast.success(texts.documents.renamed);
        router.refresh();
      }
      setEditing(false);
    });
  }

  if (!canEdit) {
    return <h1 className="font-heading text-2xl font-semibold">{title}</h1>;
  }

  if (editing) {
    return (
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          } else if (event.key === "Escape") {
            setValue(title);
            setEditing(false);
          }
        }}
        maxLength={160}
        autoFocus
        disabled={pending}
        aria-label={texts.documents.renameLabel}
        className="font-heading h-auto max-w-xl px-2 py-0.5 text-2xl font-semibold"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title={texts.documents.renameHint}
      className="group hover:bg-muted/60 -mx-2 flex items-center gap-2 rounded-md px-2 py-0.5 text-left outline-none"
    >
      <h1 className="font-heading text-2xl font-semibold">{title}</h1>
      <PencilIcon className="text-muted-foreground size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
