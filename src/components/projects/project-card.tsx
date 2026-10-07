"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelative } from "@/lib/dates";
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
    <Card className="hover:ring-foreground/20 flex flex-col transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle className="truncate">
              <Link
                href={`/projects/${project.id}`}
                className="outline-none hover:underline"
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
          <div className="-mt-1 flex shrink-0 items-center">
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
          <span>{formatRelative(project.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
