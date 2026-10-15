"use client";

import { useState } from "react";
import { LayoutGridIcon, ListIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { texts } from "@/lib/texts";
import { useStoredState } from "@/lib/use-stored-state";
import { cn } from "@/lib/utils";
import type { DocumentListItem } from "@/server/services/documents";

import { DocumentRow } from "./document-row";

const VIEWS = ["list", "grid"] as const;
type View = (typeof VIEWS)[number];

type TypeFilter = "all" | "NOTE" | "DIAGRAM";
type Sort = "updated" | "created" | "title";

const SORTERS: Record<
  Sort,
  (a: DocumentListItem, b: DocumentListItem) => number
> = {
  updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  created: (a, b) => b.createdAt.localeCompare(a.createdAt),
  title: (a, b) =>
    a.title.localeCompare(b.title, "es", {
      sensitivity: "base",
      numeric: true,
    }),
};

/** Documentos del proyecto con filtro por tipo, orden y vista lista/cuadrícula. */
export function DocumentList({
  documents,
  projectId,
  canEdit,
}: {
  documents: DocumentListItem[];
  projectId: string;
  canEdit: boolean;
}) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<Sort>("updated");
  const [view, setView] = useStoredState<View>(
    "planify:documents-view",
    "list",
    VIEWS,
  );

  const counts: Record<TypeFilter, number> = {
    all: documents.length,
    NOTE: documents.filter((document) => document.type === "NOTE").length,
    DIAGRAM: documents.filter((document) => document.type === "DIAGRAM").length,
  };

  const visible = documents
    .filter((document) => typeFilter === "all" || document.type === typeFilter)
    .sort(SORTERS[sort]);

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: "all", label: texts.documents.list.all },
    { value: "NOTE", label: texts.documents.list.notes },
    { value: "DIAGRAM", label: texts.documents.list.diagrams },
  ];
  const sortItems = [
    { value: "updated", label: texts.documents.list.sortUpdated },
    { value: "created", label: texts.documents.list.sortCreated },
    { value: "title", label: texts.documents.list.sortTitle },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label={texts.documents.list.filterLabel}
          className="bg-muted flex gap-0.5 rounded-lg p-0.5"
        >
          {typeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={typeFilter === option.value}
              onClick={() => setTypeFilter(option.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                typeFilter === option.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
              <span className="text-muted-foreground tabular-nums">
                {counts[option.value]}
              </span>
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Select
            items={sortItems}
            value={sort}
            onValueChange={(value) => setSort(value as Sort)}
          >
            <SelectTrigger
              size="sm"
              aria-label={texts.documents.list.sortLabel}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div
            role="group"
            aria-label={texts.documents.list.viewLabel}
            className="bg-muted flex gap-0.5 rounded-lg p-0.5"
          >
            {VIEWS.map((option) => {
              const Icon = option === "list" ? ListIcon : LayoutGridIcon;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={view === option}
                  aria-label={
                    option === "list"
                      ? texts.documents.list.viewList
                      : texts.documents.list.viewGrid
                  }
                  title={
                    option === "list"
                      ? texts.documents.list.viewList
                      : texts.documents.list.viewGrid
                  }
                  onClick={() => setView(option)}
                  className={cn(
                    "flex size-6 items-center justify-center rounded-md transition-colors",
                    view === option
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          {typeFilter === "NOTE"
            ? texts.documents.list.emptyNotes
            : texts.documents.list.emptyDiagrams}
        </p>
      ) : (
        <div
          className={
            view === "grid"
              ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
              : "flex flex-col gap-2"
          }
        >
          {visible.map((document) => (
            <DocumentRow
              key={document.id}
              document={document}
              projectId={projectId}
              canEdit={canEdit}
              view={view}
            />
          ))}
        </div>
      )}
    </div>
  );
}
