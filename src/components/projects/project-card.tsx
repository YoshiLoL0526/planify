"use client";

import Link from "next/link";

import { RelativeDate } from "@/components/relative-date";
import { Badge } from "@/components/ui/badge";
import { texts } from "@/lib/texts";
import { NEUTRAL_SPINE, tagSpineColor } from "@/lib/tag-color";
import type { ProjectListItem } from "@/server/services/projects";

import { FavoriteButton } from "./favorite-button";
import { ProjectActionsMenu } from "./project-actions-menu";
import type { Option } from "./types";

export function ProjectCard({
  project,
  tags,
}: {
  project: ProjectListItem;
  tags: Option[];
}) {
  const projectTags = project.tagIds
    .map((tagId) => tags.find((tag) => tag.id === tagId))
    .filter((tag): tag is Option => Boolean(tag))
    .slice(0, 3);

  const spine = projectTags[0]
    ? tagSpineColor(projectTags[0].id)
    : NEUTRAL_SPINE;

  return (
    <article
      style={{ borderLeftColor: spine }}
      className="group bg-card hover:border-foreground/20 relative flex min-h-[176px] flex-col overflow-hidden rounded-xl border border-l-[3px] p-5 shadow-[0_1px_2px_rgb(20_20_25/0.04)] transition-[border-color,box-shadow] duration-200 hover:shadow-[0_4px_16px_rgb(20_20_25/0.06)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading text-[17px] leading-snug font-medium tracking-[-0.01em]">
            <Link
              href={`/projects/${project.id}`}
              className="outline-none after:absolute after:inset-0 after:content-['']"
            >
              {project.name}
            </Link>
          </h3>
          {project.status === "ARCHIVED" ? (
            <Badge variant="outline" className="mt-2">
              {texts.projects.archivedBadge}
            </Badge>
          ) : null}
        </div>
        <div className="relative z-10 -mt-1 flex shrink-0 items-center gap-0.5">
          <FavoriteButton
            projectId={project.id}
            favorite={project.favorite}
            className="text-muted-foreground/70 hover:text-foreground"
          />
          <ProjectActionsMenu project={project} tags={tags} />
        </div>
      </div>

      {project.description ? (
        <p className="text-muted-foreground mt-2.5 line-clamp-2 text-[13px] leading-relaxed">
          {project.description}
        </p>
      ) : null}

      {projectTags.length > 0 ? (
        <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {projectTags.map((tag) => (
            <span
              key={tag.id}
              className="text-muted-foreground inline-flex items-center gap-1.5 text-[10.5px] font-medium tracking-[0.1em] uppercase"
            >
              <span
                aria-hidden
                className="size-1.5 shrink-0 rounded-full"
                style={{ background: tagSpineColor(tag.id) }}
              />
              {tag.name}
            </span>
          ))}
        </div>
      ) : null}

      <div className="text-muted-foreground mt-auto flex items-center justify-between gap-3 border-t pt-3 text-[10.5px] font-medium tracking-[0.1em] uppercase">
        <span>{texts.projects.documents(project.documentCount)}</span>
        <RelativeDate isoDate={project.updatedAt} />
      </div>
    </article>
  );
}
