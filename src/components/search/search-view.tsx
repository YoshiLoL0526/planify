"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileTextIcon,
  FolderIcon,
  FolderKanbanIcon,
  Loader2Icon,
  SearchIcon,
  ShapesIcon,
  TagIcon,
  XIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { FOCUS_SEARCH_EVENT } from "@/components/search/focus-event";
import { Highlight } from "@/components/search/highlight";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { texts } from "@/lib/texts";
import { cn } from "@/lib/utils";
import type {
  SearchGroupKind,
  SearchItem,
  SearchItemKind,
  SearchResults,
} from "@/server/services/search";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

/** Valor de los selects para «todo» (los valores vacíos no son válidos). */
const ALL = "__all__";

type Option = { id: string; name: string };

function itemHref(item: SearchItem): string {
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

/** Asigna un índice global a cada resultado para la navegación con teclado. */
function indexGroups(groups: SearchResults["groups"]) {
  let index = 0;
  return groups.map((group) => ({
    kind: group.kind as SearchGroupKind,
    items: group.items.map((item) => ({ item, index: index++ })),
  }));
}

export function SearchView({
  folders,
  tags,
  initialQuery,
  initialType,
  initialStatus,
  initialFolderId,
  initialTagId,
}: {
  folders: Option[];
  tags: Option[];
  initialQuery: string;
  initialType: string;
  initialStatus: string;
  initialFolderId: string;
  initialTagId: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType === "all" ? ALL : initialType);
  const [status, setStatus] = useState(
    initialStatus === "all" ? ALL : initialStatus,
  );
  const [folderId, setFolderId] = useState(initialFolderId || ALL);
  const [tagId, setTagId] = useState(initialTagId || ALL);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const requestIdRef = useRef(0);

  const trimmed = query.trim();
  const hasQuery = trimmed.length >= MIN_QUERY_LENGTH;
  const terms = trimmed.split(/\s+/).filter(Boolean).slice(0, 5);

  const indexedGroups = results ? indexGroups(results.groups) : [];
  const flatItems = indexedGroups.flatMap((group) =>
    group.items.map((entry) => entry.item),
  );

  // Mantiene la URL sincronizada para poder compartir la búsqueda.
  useEffect(() => {
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    if (type !== ALL) params.set("type", type);
    if (status !== ALL) params.set("status", status);
    if (folderId !== ALL) params.set("folderId", folderId);
    if (tagId !== ALL) params.set("tagId", tagId);
    const search = params.toString();
    window.history.replaceState(
      null,
      "",
      search ? `/search?${search}` : "/search",
    );
  }, [trimmed, type, status, folderId, tagId]);

  // Búsqueda con debounce; descarta respuestas obsoletas.
  useEffect(() => {
    const requestId = ++requestIdRef.current;

    if (!hasQuery) {
      // El render ya muestra la ayuda inicial; no hace falta tocar el estado.
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: trimmed,
          type: type === ALL ? "all" : type,
          status: status === ALL ? "all" : status,
        });
        if (folderId !== ALL) params.set("folderId", folderId);
        if (tagId !== ALL) params.set("tagId", tagId);

        const response = await fetch(`/api/search?${params.toString()}`, {
          cache: "no-store",
        });
        if (requestId !== requestIdRef.current) return;

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: { message?: string };
          } | null;
          throw new Error(body?.error?.message ?? texts.search.error);
        }

        const data = (await response.json()) as SearchResults;
        setResults(data);
        setError(null);
        setActiveIndex(-1);
      } catch (searchError) {
        if (requestId !== requestIdRef.current) return;
        setError(
          searchError instanceof Error
            ? searchError.message
            : texts.search.error,
        );
        setResults(null);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [trimmed, hasQuery, type, status, folderId, tagId, retryToken]);

  // Foco inicial y atajo Ctrl/⌘+K desde la propia página.
  useEffect(() => {
    inputRef.current?.focus();

    function handleFocusSearch() {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    window.addEventListener(FOCUS_SEARCH_EVENT, handleFocusSearch);
    return () =>
      window.removeEventListener(FOCUS_SEARCH_EVENT, handleFocusSearch);
  }, []);

  // Mantiene visible el resultado activo al navegar con flechas.
  useEffect(() => {
    if (activeIndex < 0) return;
    document
      .querySelector(`[data-search-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (query) {
        setQuery("");
      } else {
        inputRef.current?.blur();
      }
      return;
    }

    if (flatItems.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % flatItems.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (index) => (index - 1 + flatItems.length) % flatItems.length,
      );
    } else if (event.key === "Enter" && activeIndex >= 0) {
      const item = flatItems[activeIndex];
      if (item) {
        event.preventDefault();
        router.push(itemHref(item));
      }
    }
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

  const typeItems = [
    { value: ALL, label: texts.search.filters.allTypes },
    { value: "project", label: texts.search.filters.project },
    { value: "note", label: texts.search.filters.note },
    { value: "diagram", label: texts.search.filters.diagram },
  ];
  const statusItems = [
    { value: ALL, label: texts.search.filters.allStatuses },
    { value: "active", label: texts.search.filters.active },
    { value: "archived", label: texts.search.filters.archived },
  ];
  const folderItems = [
    { value: ALL, label: texts.search.filters.allFolders },
    ...folders.map((folder) => ({ value: folder.id, label: folder.name })),
  ];
  const tagItems = [
    { value: ALL, label: texts.search.filters.allTags },
    ...tags.map((tag) => ({ value: tag.id, label: tag.name })),
  ];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          {texts.search.title}
        </h1>
        <p className="text-muted-foreground text-sm">{texts.search.subtitle}</p>
      </div>

      <div className="relative">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={texts.search.placeholder}
          aria-label={texts.search.title}
          autoComplete="off"
          spellCheck={false}
          className="h-11 pr-9 pl-9 text-base md:text-base"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label={texts.search.clear}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1"
          >
            <XIcon className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          items={typeItems}
          value={type}
          onValueChange={(value) => setType(value as string)}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={statusItems}
          value={status}
          onValueChange={(value) => setStatus(value as string)}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {folders.length > 0 ? (
          <Select
            items={folderItems}
            value={folderId}
            onValueChange={(value) => setFolderId(value as string)}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {folderItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {tags.length > 0 ? (
          <Select
            items={tagItems}
            value={tagId}
            onValueChange={(value) => setTagId(value as string)}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tagItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {hasQuery && results && !loading ? (
          <span className="text-muted-foreground ml-auto text-xs">
            {texts.search.resultsCount(results.total)}
          </span>
        ) : null}
        {hasQuery && loading ? (
          <span className="text-muted-foreground ml-auto flex items-center gap-1.5 text-xs">
            <Loader2Icon className="size-3.5 animate-spin" />
            {texts.search.searching}
          </span>
        ) : null}
      </div>

      {!hasQuery ? (
        <div className="bg-card flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <SearchIcon className="text-muted-foreground size-6" />
          <h2 className="font-heading text-base font-medium">
            {texts.search.promptTitle}
          </h2>
          <p className="text-muted-foreground max-w-md text-sm">
            {texts.search.promptDescription}
          </p>
          <p className="text-muted-foreground text-xs">
            {texts.search.minChars}
          </p>
        </div>
      ) : error ? (
        <div className="bg-card flex flex-col items-center gap-2 rounded-lg border p-10 text-center">
          <p className="text-sm">{error}</p>
          <button
            type="button"
            className="text-sm underline underline-offset-2"
            onClick={() => setRetryToken((token) => token + 1)}
          >
            {texts.search.retry}
          </button>
        </div>
      ) : results && results.total === 0 ? (
        <div className="bg-card flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm font-medium">
            {texts.search.noResults(trimmed)}
          </p>
          <p className="text-muted-foreground text-sm">
            {texts.search.noResultsHint}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {indexedGroups.map((group) => (
            <section key={group.kind} className="flex flex-col gap-2">
              <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {texts.search.groups[group.kind]} · {group.items.length}
              </h2>
              <ul className="flex flex-col gap-1.5">
                {group.items.map(({ item, index }) => {
                  const Icon = ICONS[item.kind];
                  const meta = itemMeta(item);
                  return (
                    <li key={`${item.kind}:${item.id}`}>
                      <Link
                        href={itemHref(item)}
                        data-search-index={index}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={cn(
                          "bg-card flex items-start gap-3 rounded-lg border p-3 transition-colors",
                          index === activeIndex
                            ? "border-ring bg-accent"
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
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
