"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, SearchIcon, XIcon } from "lucide-react";

import { FOCUS_SEARCH_EVENT } from "@/components/search/focus-event";
import {
  indexGroups,
  itemHref,
  SearchResultList,
} from "@/components/search/search-results";
import { useSearch } from "@/components/search/use-search";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { texts } from "@/lib/texts";
import type { SearchGroupKind, SearchResults } from "@/server/services/search";

/** Valor de los selects para «todo» (los valores vacíos no son válidos). */
const ALL = "__all__";

const DEFAULT_LIMIT = 50;
const EXPANDED_LIMIT = 200;

type Option = { id: string; name: string };

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
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { trimmed, hasQuery, results, loading, error, retry } = useSearch({
    query,
    type: type === ALL ? "all" : type,
    status: status === ALL ? "all" : status,
    folderId: folderId === ALL ? undefined : folderId,
    tagId: tagId === ALL ? undefined : tagId,
    limit,
  });

  // Reinicia la selección con cada nuevo lote de resultados.
  const [lastResults, setLastResults] = useState<SearchResults | null>(null);
  if (lastResults !== results) {
    setLastResults(results);
    setActiveIndex(-1);
  }

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

  /**
   * «Ver más» de un grupo (RNF-08): enfoca la búsqueda en ese tipo y amplía
   * el límite por grupo. El filtro «Tipo» queda visible para volver atrás.
   */
  function handleSeeMoreGroup(kind: SearchGroupKind) {
    const typeByGroup: Partial<Record<SearchGroupKind, string>> = {
      projects: "project",
      notes: "note",
      diagrams: "diagram",
    };
    const nextType = typeByGroup[kind];
    if (!nextType) return;
    setType(nextType);
    setLimit(EXPANDED_LIMIT);
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
          onValueChange={(value) => {
            setType(value as string);
            setLimit(DEFAULT_LIMIT);
          }}
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
            onClick={retry}
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
        <SearchResultList
          groups={indexedGroups}
          terms={terms}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
          onSeeMoreGroup={
            limit < EXPANDED_LIMIT ? handleSeeMoreGroup : undefined
          }
        />
      )}
    </div>
  );
}
