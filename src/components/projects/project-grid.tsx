"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { texts } from "@/lib/texts";
import { loadMoreProjectsAction } from "@/server/actions/projects";
import type {
  ProjectListItem,
  ProjectListPage,
} from "@/server/services/projects";
import type { ProjectView } from "@/server/validators/project";

import { ProjectCard } from "./project-card";
import type { Option } from "./types";

export function ProjectGrid({
  initialItems,
  initialNextCursor,
  view,
  folderId,
  tagId,
  folders,
  tags,
}: {
  initialItems: ProjectListItem[];
  initialNextCursor: string | null;
  view: ProjectView;
  folderId?: string;
  tagId?: string;
  folders: Option[];
  tags: Option[];
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialNextCursor);
  const [lastInitial, setLastInitial] = useState(initialItems);
  const [pending, startTransition] = useTransition();

  // Sincroniza con los datos del servidor cuando `router.refresh()` los actualiza.
  if (lastInitial !== initialItems) {
    setLastInitial(initialItems);
    setItems(initialItems);
    setCursor(initialNextCursor);
  }

  function loadMore() {
    startTransition(async () => {
      const result = await loadMoreProjectsAction({
        view,
        folderId,
        tagId,
        cursor,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      const page: ProjectListPage = result.data;
      setItems((previous) => [...previous, ...page.items]);
      setCursor(page.nextCursor);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            folders={folders}
            tags={tags}
          />
        ))}
      </div>

      {cursor ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={pending}>
            {pending ? texts.common.loading : texts.projects.loadMore}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
