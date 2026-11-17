"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRightIcon, Loader2Icon, SearchIcon } from "lucide-react";

import {
  FOCUS_SEARCH_EVENT,
  OPEN_SEARCH_EVENT,
} from "@/components/search/focus-event";
import {
  indexGroups,
  itemHref,
  SearchResultList,
} from "@/components/search/search-results";
import { useSearch } from "@/components/search/use-search";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { texts } from "@/lib/texts";
import { cn } from "@/lib/utils";
import type { SearchResults } from "@/server/services/search";

const TYPES = ["all", "project", "note", "diagram"] as const;
type TypeFilter = (typeof TYPES)[number];

const TYPE_LABELS: Record<TypeFilter, string> = {
  all: texts.search.filters.all,
  project: texts.search.groups.projects,
  note: texts.search.groups.notes,
  diagram: texts.search.groups.diagrams,
};

/**
 * Buscador global en modal (paleta de comandos) con atajo Ctrl/⌘+K
 * (docs/08 · 8.6). En /search el atajo enfoca el campo de la página.
 */
export function SearchDialog() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { trimmed, hasQuery, results, loading, error, retry } = useSearch({
    query,
    type,
    status: "all",
  });

  // Reinicia la selección con cada nuevo lote de resultados.
  const [lastResults, setLastResults] = useState<SearchResults | null>(null);
  if (lastResults !== results) {
    setLastResults(results);
    setActiveIndex(results && results.total > 0 ? 0 : -1);
  }

  const terms = trimmed.split(/\s+/).filter(Boolean).slice(0, 5);
  const indexedGroups = hasQuery && results ? indexGroups(results.groups) : [];
  const flatItems = indexedGroups.flatMap((group) =>
    group.items.map((entry) => entry.item),
  );
  const fullSearchHref = `/search?${new URLSearchParams({
    q: trimmed,
    ...(type !== "all" ? { type } : {}),
  }).toString()}`;

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (pathname.startsWith("/search")) {
          window.dispatchEvent(new Event(FOCUS_SEARCH_EVENT));
        } else {
          setOpen((current) => !current);
        }
      }
    }
    function handleOpen() {
      setOpen(true);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener(OPEN_SEARCH_EVENT, handleOpen);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener(OPEN_SEARCH_EVENT, handleOpen);
    };
  }, [pathname]);

  // Mantiene visible el resultado activo al navegar con flechas.
  useEffect(() => {
    if (activeIndex < 0) return;
    document
      .querySelector(
        `[data-search-dialog] [data-search-index="${activeIndex}"]`,
      )
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setType("all");
    }
  }

  function navigate(href: string) {
    handleOpenChange(false);
    router.push(href);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      const item = flatItems[activeIndex];
      if (item) {
        event.preventDefault();
        navigate(itemHref(item));
      } else if (hasQuery) {
        event.preventDefault();
        navigate(fullSearchHref);
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
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-search-dialog
        showCloseButton={false}
        initialFocus={inputRef}
        className="top-[12vh] flex max-h-[76vh] translate-y-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <DialogTitle className="sr-only">{texts.search.title}</DialogTitle>
        <DialogDescription className="sr-only">
          {texts.search.subtitle}
        </DialogDescription>

        <div className="flex h-14 items-center gap-3 border-b px-4">
          {loading ? (
            <Loader2Icon className="text-muted-foreground size-4 shrink-0 animate-spin" />
          ) : (
            <SearchIcon className="text-muted-foreground size-4 shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={texts.search.placeholder}
            aria-label={texts.search.title}
            autoComplete="off"
            spellCheck={false}
            className="placeholder:text-muted-foreground/80 h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none"
          />
          <kbd className="text-muted-foreground border-border bg-background hidden rounded border px-1.5 py-0.5 font-sans text-[10px] font-medium sm:inline">
            Esc
          </kbd>
        </div>

        <div
          role="group"
          aria-label={texts.search.filters.type}
          className="flex items-center gap-0.5 border-b px-3"
        >
          {TYPES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={type === option}
              onClick={() => {
                setType(option);
                inputRef.current?.focus();
              }}
              className={cn(
                "-mb-px border-b-2 px-2.5 py-2 text-[12px] font-medium transition-colors",
                type === option
                  ? "border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {TYPE_LABELS[option]}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {!hasQuery ? (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
              <div className="bg-card flex size-10 items-center justify-center rounded-lg border">
                <SearchIcon className="text-primary/60 size-4" />
              </div>
              <div className="space-y-1">
                <p className="font-heading text-base font-medium">
                  {texts.search.promptTitle}
                </p>
                <p className="text-muted-foreground mx-auto max-w-sm text-[12px] leading-relaxed">
                  {texts.search.promptDescription}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
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
            <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
              <p className="text-sm font-medium">
                {texts.search.noResults(trimmed)}
              </p>
              <p className="text-muted-foreground text-xs">
                {texts.search.noResultsHint}
              </p>
            </div>
          ) : results ? (
            <SearchResultList
              compact
              groups={indexedGroups}
              terms={terms}
              activeIndex={activeIndex}
              onActiveIndexChange={setActiveIndex}
              onNavigate={() => handleOpenChange(false)}
            />
          ) : (
            <p className="text-muted-foreground px-4 py-8 text-center text-sm">
              {texts.search.searching}
            </p>
          )}
        </div>

        <div className="text-muted-foreground bg-muted/20 flex items-center justify-between gap-2 border-t px-4 py-2 text-[10.5px] font-medium tracking-[0.08em] uppercase">
          <span className="hidden items-center gap-3 sm:flex">
            <span>
              <kbd className="border-border bg-background rounded border px-1 py-0.5 font-sans tracking-normal">
                ↑↓
              </kbd>{" "}
              {texts.search.hints.navigate}
            </span>
            <span>
              <kbd className="border-border bg-background rounded border px-1 py-0.5 font-sans tracking-normal">
                ↵
              </kbd>{" "}
              {texts.search.hints.open}
            </span>
          </span>
          {hasQuery ? (
            <Link
              href={fullSearchHref}
              onClick={() => handleOpenChange(false)}
              className="hover:text-foreground ml-auto flex items-center gap-1 font-medium"
            >
              {texts.search.seeAll}
              <ArrowRightIcon className="size-3.5" />
            </Link>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
