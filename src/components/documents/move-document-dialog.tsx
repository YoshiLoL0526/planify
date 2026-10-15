"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { texts } from "@/lib/texts";
import { moveDocumentAction } from "@/server/actions/documents";

/** Valor del select para la raíz del proyecto (los vacíos no son válidos). */
const ROOT = "__root__";

/** Mover un documento a una carpeta del proyecto (o de vuelta a la raíz). */
export function MoveDocumentDialog({
  document,
  folders,
  currentFolderId,
  onOpenChange,
}: {
  document: { id: string; title: string };
  folders: { id: string; name: string }[];
  currentFolderId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [destination, setDestination] = useState(currentFolderId ?? ROOT);

  const items = [
    { value: ROOT, label: texts.documents.moveRoot },
    ...folders.map((folder) => ({ value: folder.id, label: folder.name })),
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const result = await moveDocumentAction({
      documentId: document.id,
      folderId: destination === ROOT ? null : destination,
    });
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(texts.documents.moved);
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{texts.documents.moveTitle}</DialogTitle>
          <DialogDescription>
            {texts.documents.moveDescription(document.title)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{texts.documents.moveLabel}</Label>
            <Select
              items={items}
              value={destination}
              onValueChange={(value) => setDestination(value as string)}
            >
              <SelectTrigger
                className="w-full"
                aria-label={texts.documents.moveLabel}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {texts.common.cancel}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2Icon className="animate-spin" />}
              {texts.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
