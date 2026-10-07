"use client";

import { useState, type FormEvent } from "react";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { texts } from "@/lib/texts";

/**
 * Diálogo genérico para crear o renombrar (carpetas, etiquetas…).
 * Se monta condicionalmente desde el padre para reiniciar su estado.
 */
export function NameDialog({
  onOpenChange,
  title,
  description,
  label,
  initialValue = "",
  submitLabel,
  maxLength = 80,
  onSubmit,
}: {
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  label: string;
  initialValue?: string;
  submitLabel: string;
  maxLength?: number;
  onSubmit: (name: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [name, setName] = useState(initialValue);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await onSubmit(name.trim());
    setPending(false);

    if (!result.ok) {
      setError(result.error ?? texts.common.unexpectedError);
      return;
    }
    onOpenChange(false);
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{label}</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={maxLength}
              autoFocus
              required
            />
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
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
            <Button
              type="submit"
              disabled={pending || name.trim().length === 0}
            >
              {pending && <Loader2Icon className="animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
