"use client";

import { useEffect, useState } from "react";
import { Loader2Icon, MessageSquareIcon, QuoteIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import {
  COMMENT_QUOTE_EVENT,
  MAX_QUOTE_LENGTH,
} from "@/components/comments/events";
import { MentionTextarea } from "@/components/comments/mention-textarea";
import { ThreadCard } from "@/components/comments/thread-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { texts } from "@/lib/texts";
import { cn } from "@/lib/utils";
import { createThreadAction } from "@/server/actions/comments";
import type { ThreadView } from "@/server/services/comments";

type Filter = "open" | "resolved" | "all";

type MemberOption = { id: string; name: string };

/**
 * Sección de comentarios bajo el documento (RF-705): hilos abiertos/resueltos,
 * composer con menciones y cita de selección.
 */
export function CommentsSection({
  documentId,
  initialThreads,
  members,
  currentUserId,
  role,
  canComment,
}: {
  documentId: string;
  initialThreads: ThreadView[];
  members: MemberOption[];
  currentUserId: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  canComment: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("open");
  const [threads, setThreads] = useState<ThreadView[]>(initialThreads);
  const [lastInitial, setLastInitial] = useState(initialThreads);
  const [error, setError] = useState<string | null>(null);
  const [newBody, setNewBody] = useState("");
  const [anchorQuote, setAnchorQuote] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [highlightThreadId, setHighlightThreadId] = useState<string | null>(
    null,
  );

  // Sincroniza con los datos del servidor cuando una acción revalida la página.
  if (lastInitial !== initialThreads) {
    setLastInitial(initialThreads);
    setThreads(initialThreads);
  }

  const openCount = threads.filter((thread) => thread.status === "OPEN").length;
  const displayed =
    filter === "open"
      ? threads.filter((thread) => thread.status === "OPEN")
      : filter === "resolved"
        ? threads.filter((thread) => thread.status === "RESOLVED")
        : threads;

  // Resalta el hilo si se llega desde una notificación (#thread-…).
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#thread-")) return;
    const threadId = hash.slice("#thread-".length);
    const timer = setTimeout(() => {
      setFilter("all");
      setHighlightThreadId(threadId);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // «Comentar» desde la selección del editor: cita el texto y lleva al composer.
  useEffect(() => {
    if (!canComment) return;
    function handleQuote(event: Event) {
      const quote = (event as CustomEvent<string>).detail;
      if (!quote) return;
      setAnchorQuote(quote);
      const section = document.getElementById("comentarios");
      section?.scrollIntoView({ behavior: "smooth", block: "start" });
      section
        ?.querySelector<HTMLTextAreaElement>("textarea")
        ?.focus({ preventScroll: true });
    }
    window.addEventListener(COMMENT_QUOTE_EVENT, handleQuote);
    return () => window.removeEventListener(COMMENT_QUOTE_EVENT, handleQuote);
  }, [canComment]);

  // Desplaza el hilo resaltado a la vista.
  useEffect(() => {
    if (!highlightThreadId) return;
    document
      .getElementById(`thread-${highlightThreadId}`)
      ?.scrollIntoView({ block: "center" });
  }, [highlightThreadId, threads]);

  async function refetch() {
    try {
      const response = await fetch(
        `/api/documents/${documentId}/threads?status=all`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new Error(body?.error?.message ?? texts.comments.error);
      }
      const data = (await response.json()) as { threads: ThreadView[] };
      setThreads(data.threads);
      setError(null);
    } catch (refetchError) {
      setError(
        refetchError instanceof Error
          ? refetchError.message
          : texts.comments.error,
      );
    }
  }

  function captureSelection() {
    const selected = window.getSelection()?.toString().trim() ?? "";
    if (!selected) {
      toast.info(texts.comments.anchor);
      return;
    }
    setAnchorQuote(selected.slice(0, MAX_QUOTE_LENGTH));
  }

  async function handleCreate() {
    if (newBody.trim().length === 0) return;
    setSending(true);
    const result = await createThreadAction({
      documentId,
      body: newBody,
      anchor: anchorQuote ? { type: "note", quote: anchorQuote } : null,
    });
    setSending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setNewBody("");
    setAnchorQuote(null);
    toast.success(texts.comments.created);
    await refetch();
  }

  return (
    <section
      id="comentarios"
      aria-labelledby="comentarios-titulo"
      className="flex w-full max-w-3xl scroll-mt-6 flex-col gap-4"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="comentarios-titulo"
          className="font-heading flex items-center gap-2 text-lg font-medium"
        >
          <MessageSquareIcon className="size-5" />
          {texts.comments.title}
          {openCount > 0 ? (
            <Badge variant="secondary">{openCount}</Badge>
          ) : null}
        </h2>

        <div
          role="group"
          aria-label={texts.comments.filterLabel}
          className="bg-muted flex gap-0.5 rounded-lg p-0.5"
        >
          {(["open", "resolved", "all"] as Filter[]).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={filter === option}
              onClick={() => setFilter(option)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                filter === option
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {texts.comments.filter[option]}
            </button>
          ))}
        </div>
      </header>

      {canComment ? (
        <div className="bg-card flex flex-col gap-2 rounded-lg border p-3">
          <MentionTextarea
            value={newBody}
            onChange={setNewBody}
            members={members}
            placeholder={texts.comments.newThreadPlaceholder}
            rows={3}
            onSubmit={() => void handleCreate()}
          />

          {anchorQuote ? (
            <div className="bg-muted flex items-start justify-between gap-2 rounded-md px-2 py-1 text-xs">
              <span className="min-w-0">
                <span className="text-muted-foreground">
                  {texts.comments.anchor}:{" "}
                </span>
                «{anchorQuote}»
              </span>
              <button
                type="button"
                aria-label={texts.comments.anchorRemove}
                onClick={() => setAnchorQuote(null)}
              >
                <XIcon className="size-3" />
              </button>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={sending}
              onClick={captureSelection}
            >
              <QuoteIcon /> {texts.comments.quoteSelection}
            </Button>
            <Button
              size="xs"
              disabled={sending || newBody.trim().length === 0}
              onClick={() => void handleCreate()}
            >
              {sending ? <Loader2Icon className="animate-spin" /> : null}
              {texts.comments.send}
            </Button>
          </div>
        </div>
      ) : (
        <p className="bg-muted text-muted-foreground rounded-md px-2 py-1.5 text-xs">
          {texts.comments.archivedNotice}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {error ? (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="xs" onClick={() => void refetch()}>
              {texts.comments.retry}
            </Button>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm font-medium">
              {filter === "resolved"
                ? texts.comments.emptyResolved
                : texts.comments.empty}
            </p>
            <p className="text-muted-foreground text-xs">
              {texts.comments.emptyDescription}
            </p>
          </div>
        ) : (
          displayed.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              members={members}
              currentUserId={currentUserId}
              role={role}
              canComment={canComment}
              highlighted={thread.id === highlightThreadId}
              onChanged={refetch}
            />
          ))
        )}
      </div>
    </section>
  );
}
