"use client";

import Link from "next/link";

import { RelativeDate } from "@/components/relative-date";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { texts } from "@/lib/texts";
import type { ProjectListItem } from "@/server/services/projects";

import { FavoriteButton } from "./favorite-button";
import { ProjectActionsMenu } from "./project-actions-menu";
import type { Option } from "./types";

export function ProjectCard({
  project,
  folders,
  tags,
}: {
  project: ProjectListItem;
  folders: Option[];
  tags: Option[];
}) {
  const projectTags = project.tagIds
    .map((tagId) => tags.find((tag) => tag.id === tagId))
    .filter((tag): tag is Option => Boolean(tag))
    .slice(0, 3);

  return (
    <Card className="hover:ring-foreground/20 has-[a:focus-visible]:ring-ring/50 relative flex flex-col transition-shadow hover:shadow-md has-[a:focus-visible]:ring-3">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle className="truncate">
              <Link
                href={`/projects/${project.id}`}
                className="outline-none after:absolute after:inset-0 after:content-['']"
              >
                {project.name}
              </Link>
            </CardTitle>
            {project.status === "ARCHIVED" ? (
              <Badge variant="outline" className="w-fit">
                {texts.projects.archivedBadge}
              </Badge>
            ) : null}
          </div>
          <div className="relative z-10 -mt-1 flex shrink-0 items-center">
            <FavoriteButton
              projectId={project.id}
              favorite={project.favorite}
            />
            <ProjectActionsMenu
              project={project}
              folders={folders}
              tags={tags}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {project.description ? (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {project.description}
          </p>
        ) : null}

        {projectTags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {projectTags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="text-muted-foreground mt-auto flex items-center justify-between text-xs">
          <span>{texts.projects.documents(project.documentCount)}</span>
          <RelativeDate isoDate={project.updatedAt} />
        </div>
      </CardContent>
    </Card>
  );
}
