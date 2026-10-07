"use client";

import { useState, type ReactNode } from "react";
import { Loader2Icon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { texts } from "@/lib/texts";

/**
 * Confirmación para acciones destructivas. Si se indica `confirmationText`,
 * hay que escribirlo exactamente para habilitar el botón (RF-205).
 * Se monta condicionalmente desde el padre para reiniciar su estado.
 */
export function ConfirmDialog({
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmationText,
  pending = false,
  onConfirm,
}: {
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  confirmationText?: string;
  pending?: boolean;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const canConfirm = !confirmationText || typed.trim() === confirmationText;

  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {confirmationText ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmation-text">
              {texts.common.typeToConfirm(confirmationText)}
            </Label>
            <Input
              id="confirmation-text"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {texts.common.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!canConfirm || pending}
            onClick={onConfirm}
          >
            {pending && <Loader2Icon className="animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
