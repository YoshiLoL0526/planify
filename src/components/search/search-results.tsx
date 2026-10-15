"use client";

import Link from "next/link";
import {
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
      return `/folders/${item.id}`;
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
        <section key={group.kind} className="flex flex-col gap-1.5">
          <h2
            className={cn(
              "text-muted-foreground text-xs font-semibold tracking-wide uppercase",
              compact && "px-2",
            )}
          >
            {texts.search.groups[group.kind]} · {group.items.length}
          </h2>
          <ul className={cn("flex flex-col", compact ? "gap-0.5" : "gap-1.5")}>
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
                      "flex items-start gap-3 rounded-lg transition-colors outline-none",
                      compact ? "px-2 py-2" : "bg-card border p-3",
                      active
                        ? compact
                          ? "bg-accent"
                          : "border-ring bg-accent"
                        : "hover:bg-accent/50",
                    )}
                  >
                    <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          <Highlight text={item.title} terms={terms} />
                        </span>
                        {item.archived ? (
                          <Badge variant="secondary">
                            {texts.projects.archivedBadge}
                          </Badge>
                        ) : null}
                      </div>
                      {item.snippet ? (
                        <p className="text-muted-foreground line-clamp-2 text-xs">
                          <Highlight text={item.snippet} terms={terms} />
                        </p>
                      ) : null}
                      {meta ? (
                        <p className="text-muted-foreground truncate text-xs">
                          {meta}
                        </p>
                      ) : null}
                    </div>
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
                "text-primary self-start rounded-md text-xs font-medium underline-offset-4 hover:underline",
                compact ? "px-2" : "px-1",
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
