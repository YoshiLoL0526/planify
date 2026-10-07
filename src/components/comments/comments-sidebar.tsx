"use client";

import { useEffect, useState } from "react";
import { Loader2Icon, MessageSquareIcon, QuoteIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

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
 * Panel lateral de comentarios del documento (RF-705): colapsable, con
 * hilos abiertos/resueltos, composer con menciones y cita de selección.
 */
export function CommentsSidebar({
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
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("open");
  const [threads, setThreads] = useState<ThreadView[]>(initialThreads);
  const [error, setError] = useState<string | null>(null);
  const [newBody, setNewBody] = useState("");
  const [anchorQuote, setAnchorQuote] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [highlightThreadId, setHighlightThreadId] = useState<string | null>(
    null,
  );

  const openCount = threads.filter((thread) => thread.status === "OPEN").length;
  const displayed =
    filter === "open"
      ? threads.filter((thread) => thread.status === "OPEN")
      : filter === "resolved"
        ? threads.filter((thread) => thread.status === "RESOLVED")
        : threads;

  // Abre el panel si se llega desde una notificación (#thread-…).
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#thread-")) return;
    const threadId = hash.slice("#thread-".length);
    const timer = setTimeout(() => {
      setOpen(true);
      setFilter("all");
      setHighlightThreadId(threadId);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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
    setAnchorQuote(selected.slice(0, 200));
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

  if (!open) {
    return (
      <div className="lg:sticky lg:top-6">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setOpen(true)}
        >
          <MessageSquareIcon />
          {texts.comments.open}
          {openCount > 0 ? (
            <Badge variant="secondary">{openCount}</Badge>
          ) : null}
        </Button>
      </div>
    );
  }

  return (
    <aside className="bg-card flex w-full flex-col gap-3 rounded-lg border p-3 lg:sticky lg:top-6 lg:max-h-[calc(100svh-3rem)] lg:w-80 lg:shrink-0">
      <header className="flex items-center justify-between gap-2">
        <h2 className="font-heading flex items-center gap-2 text-sm font-medium">
          <MessageSquareIcon className="size-4" />
          {texts.comments.title}
        </h2>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={texts.comments.close}
          onClick={() => setOpen(false)}
        >
          <XIcon />
        </Button>
      </header>

      <div className="flex gap-1">
        {(["open", "resolved", "all"] as Filter[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium",
              filter === option
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50",
            )}
          >
            {texts.comments.filter[option]}
          </button>
        ))}
      </div>

      {canComment ? (
        <div className="flex flex-col gap-2 border-b pb-3">
          <MentionTextarea
            value={newBody}
            onChange={setNewBody}
            members={members}
            placeholder={texts.comments.newThreadPlaceholder}
            rows={2}
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

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
        {error ? (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="xs" onClick={() => void refetch()}>
              {texts.comments.retry}
            </Button>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center gap-1 p-4 text-center">
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
    </aside>
  );
}
