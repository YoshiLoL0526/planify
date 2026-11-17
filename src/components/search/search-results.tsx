"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  FileTextIcon,
  FolderIcon,
  FolderKanbanIcon,
  ShapesIcon,
  TagIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Highlight } from "@/components/search/highlight";
import { Badge } from "@/components/ui/badge";
import { texts } from "@/lib/texts";
import { cn } from "@/lib/utils";
import type {
  SearchGroupKind,
  SearchItem,
  SearchItemKind,
  SearchResults,
} from "@/server/services/search";

export function itemHref(item: SearchItem): string {
  switch (item.kind) {
    case "project":
      return `/projects/${item.id}`;
    case "note":
    case "diagram":
      return `/projects/${item.projectId}/documents/${item.id}`;
    case "tag":
      return `/tags/${item.id}`;
    case "folder":
      return `/projects/${item.projectId}/folders/${item.id}`;
  }
}

const ICONS: Record<SearchItemKind, LucideIcon> = {
  project: FolderKanbanIcon,
  note: FileTextIcon,
  diagram: ShapesIcon,
  tag: TagIcon,
  folder: FolderIcon,
};

export type IndexedGroup = {
  kind: SearchGroupKind;
  items: { item: SearchItem; index: number }[];
  /** El grupo tiene más resultados de los mostrados (RNF-08 · «Ver más»). */
  hasMore: boolean;
};

/** Asigna un índice global a cada resultado para la navegación con teclado. */
export function indexGroups(groups: SearchResults["groups"]): IndexedGroup[] {
  let index = 0;
  return groups.map((group) => ({
    kind: group.kind as SearchGroupKind,
    hasMore: group.hasMore,
    items: group.items.map((item) => ({ item, index: index++ })),
  }));
}

function itemMeta(item: SearchItem): string | null {
  if (item.kind === "note" || item.kind === "diagram") {
    return `${texts.search.itemKinds[item.kind]} · ${item.projectName}`;
  }
  if (item.kind === "project") {
    return texts.search.itemKinds.project;
  }
  if (item.kind === "folder") {
    const parts: string[] = [texts.search.itemKinds.folder];
    if (item.documentCount !== null) {
      parts.push(texts.folders.documentCount(item.documentCount));
    }
    if (item.projectName) parts.push(item.projectName);
    return parts.join(" · ");
  }
  return item.projectCount !== null
    ? texts.search.projectCount(item.projectCount)
    : null;
}

/** Resultados agrupados por tipo; compartidos por la página y el modal de búsqueda. */
export function SearchResultList({
  groups,
  terms,
  activeIndex,
  onActiveIndexChange,
  onNavigate,
  onSeeMoreGroup,
  compact = false,
}: {
  groups: IndexedGroup[];
  terms: string[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onNavigate?: () => void;
  /** Si se define, cada grupo truncado muestra «Ver más» (RNF-08). */
  onSeeMoreGroup?: (kind: SearchGroupKind) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col", compact ? "gap-3" : "gap-6")}>
      {groups.map((group) => (
        <section key={group.kind} className="flex flex-col gap-2">
          <h2
            className={cn(
              "micro text-muted-foreground",
              compact ? "px-2" : "px-0.5",
            )}
          >
            {texts.search.groups[group.kind]} · {group.items.length}
          </h2>
          <ul
            className={cn(
              compact
                ? "flex flex-col gap-0.5"
                : "bg-card divide-y overflow-hidden rounded-xl border",
            )}
          >
            {group.items.map(({ item, index }) => {
              const Icon = ICONS[item.kind];
              const meta = itemMeta(item);
              const active = index === activeIndex;
              return (
                <li key={`${item.kind}:${item.id}`}>
                  <Link
                    href={itemHref(item)}
                    data-search-index={index}
                    data-active={active || undefined}
                    onMouseMove={() => onActiveIndexChange(index)}
                    onClick={onNavigate}
                    className={cn(
                      "relative flex items-start gap-3 transition-colors outline-none",
                      compact ? "rounded-md px-2 py-2" : "px-4 py-3",
                      active
                        ? compact
                          ? "bg-accent"
                          : "bg-accent/50"
                        : "hover:bg-accent/40",
                    )}
                  >
                    {active && !compact ? (
                      <span
                        aria-hidden
                        className="bg-primary absolute inset-y-2 left-0 w-[2px] rounded-full"
                      />
                    ) : null}
                    {compact ? (
                      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    ) : (
                      <div className="bg-muted/50 flex size-8 shrink-0 items-center justify-center rounded-md border">
                        <Icon className="text-muted-foreground size-4" />
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13.5px] font-medium">
                          <Highlight text={item.title} terms={terms} />
                        </span>
                        {item.archived ? (
                          <Badge variant="outline">
                            {texts.projects.archivedBadge}
                          </Badge>
                        ) : null}
                      </div>
                      {item.snippet ? (
                        <p className="text-muted-foreground line-clamp-2 text-[11.5px] leading-relaxed">
                          <Highlight text={item.snippet} terms={terms} />
                        </p>
                      ) : null}
                      {meta ? (
                        <p className="text-muted-foreground/80 truncate text-[10.5px] font-medium tracking-[0.08em] uppercase">
                          {meta}
                        </p>
                      ) : null}
                    </div>
                    {!compact ? (
                      <ArrowRightIcon className="text-muted-foreground/40 mt-1 size-3.5 shrink-0" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
          {onSeeMoreGroup && group.hasMore ? (
            <button
              type="button"
              onClick={() => onSeeMoreGroup(group.kind)}
              className={cn(
                "text-primary focus-visible:ring-ring/30 self-start rounded-sm text-[12px] font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none",
                compact ? "px-2" : "px-0.5",
              )}
            >
              {texts.search.seeMore}
            </button>
          ) : null}
        </section>
      ))}
    </div>
  );
}
