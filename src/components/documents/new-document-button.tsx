"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileTextIcon, Loader2Icon, PlusIcon, ShapesIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { texts } from "@/lib/texts";
import { createDocumentAction } from "@/server/actions/documents";

export function NewDocumentButton({
  projectId,
  folderId,
}: {
  projectId: string;
  /** Si se indica, el documento se crea dentro de esa carpeta (RF-301). */
  folderId?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function create(type: "NOTE" | "DIAGRAM") {
    setPending(true);
    const result = await createDocumentAction({ projectId, type, folderId });
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      type === "NOTE"
        ? texts.documents.createdNote
        : texts.documents.createdDiagram,
    );
    router.push(`/projects/${projectId}/documents/${result.data.documentId}`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="sm" />}>
        {pending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
        {texts.documents.newDocument}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => create("NOTE")} disabled={pending}>
          <FileTextIcon /> {texts.documents.newNote}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => create("DIAGRAM")} disabled={pending}>
          <ShapesIcon /> {texts.documents.newDiagram}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
