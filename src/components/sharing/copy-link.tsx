"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { texts } from "@/lib/texts";
import { cn } from "@/lib/utils";

/** Copia con fallback para contextos sin permiso de portapapeles. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      textarea.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** Enlace de invitación con botón de copiar (RF-802, RF-803). */
export function CopyLink({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyToClipboard(url);
    if (!ok) {
      toast.error(texts.common.unexpectedError);
      return;
    }
    setCopied(true);
    toast.success(texts.sharing.invitations.copied);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Input
        readOnly
        value={url}
        onFocus={(event) => event.currentTarget.select()}
        aria-label={texts.sharing.invitations.link}
        className="font-mono text-xs"
      />
      <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
        {copied ? <CheckIcon /> : <CopyIcon />}
        {texts.sharing.invitations.copy}
      </Button>
    </div>
  );
}
