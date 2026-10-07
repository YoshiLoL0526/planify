"use client";

import { useState, useTransition } from "react";
import { StarIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { texts } from "@/lib/texts";
import { setFavoriteAction } from "@/server/actions/projects";

export function FavoriteButton({
  projectId,
  favorite,
  className,
}: {
  projectId: string;
  favorite: boolean;
  className?: string;
}) {
  const [isFavorite, setIsFavorite] = useState(favorite);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !isFavorite;
    setIsFavorite(next);

    startTransition(async () => {
      const result = await setFavoriteAction({ projectId, favorite: next });
      if (!result.ok) {
        setIsFavorite(!next);
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={texts.projects.actions.favorite}
      aria-pressed={isFavorite}
      disabled={pending}
      onClick={toggle}
      className={className}
    >
      <StarIcon className={cn(isFavorite && "fill-amber-400 text-amber-400")} />
    </Button>
  );
}
