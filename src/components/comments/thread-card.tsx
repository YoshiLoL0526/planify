"use client";

import { useState, type ReactNode } from "react";
import {
  CheckCircle2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  QuoteIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { MentionTextarea } from "@/components/comments/mention-textarea";
import { ConfirmDialog } from "@/components/organization/confirm-dialog";
import { RelativeDate } from "@/components/relative-date";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { texts } from "@/lib/texts";
import { getInitials } from "@/lib/user";
import { cn } from "@/lib/utils";
import {
  deleteCommentAction,
  deleteThreadAction,
  editCommentAction,
  replyToThreadAction,
  setThreadStatusAction,
} from "@/server/actions/comments";
import type { CommentView, ThreadView } from "@/server/services/comments";

type MemberOption = { id: string; name: string };

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Resalta las menciones a miembros dentro del texto (RF-704). */
function CommentBody({
  body,
  members,
}: {
  body: string;
  members: MemberOption[];
}) {
  const className = "text-[13px] leading-relaxed whitespace-pre-wrap";

  if (members.length === 0) {
    return <p className={className}>{body}</p>;
  }

  const names = members
    .map((member) => member.name)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);
  const pattern = new RegExp(
    `(?:^|[^\\p{L}\\p{N}_])(@(?:${names.join("|")}))(?=$|[^\\p{L}\\p{N}_])`,
    "giu",
  );

  const segments: ReactNode[] = [];
  let cursor = 0;
  for (const match of body.matchAll(pattern)) {
    const mention = match[1];
    const index = (match.index ?? 0) + match[0].length - mention.length;
    if (index > cursor) {
      segments.push(body.slice(cursor, index));
    }
    segments.push(
      <span key={`${index}-${mention}`} className="text-primary font-medium">
        {mention}
      </span>,
    );
    cursor = index + mention.length;
  }
  if (cursor < body.length) {
    segments.push(body.slice(cursor));
  }

  return <p className={className}>{segments}</p>;
}

function CommentAvatar({ name }: { name: string | null }) {
  const label = name ?? texts.comments.deletedUser;
  return (
    <Avatar size="sm" className="mt-0.5 size-6">
      <AvatarFallback>{getInitials(label)}</AvatarFallback>
    </Avatar>
  );
}

/** Tarjeta de un hilo con sus mensajes, respuestas y acciones (RF-701 a RF-706). */
export function ThreadCard({
  thread,
  members,
  currentUserId,
  role,
  canComment,
  highlighted,
  onChanged,
}: {
  thread: ThreadView;
  members: MemberOption[];
  currentUserId: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  canComment: boolean;
  highlighted: boolean;
  onChanged: () => Promise<void>;
}) {
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [commentToDelete, setCommentToDelete] = useState<CommentView | null>(
    null,
  );
  const [threadDeleteOpen, setThreadDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const canResolve =
    currentUserId === thread.authorId || role === "EDITOR" || role === "OWNER";
  const canDeleteThread = currentUserId === thread.authorId || role === "OWNER";
  const resolved = thread.status === "RESOLVED";

  async function handleReply() {
    if (reply.trim().length === 0) return;
    setSending(true);
    const result = await replyToThreadAction({
      threadId: thread.id,
      body: reply,
    });
    setSending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setReply("");
    await onChanged();
  }

  async function handleToggleStatus() {
    setBusy(true);
    const result = await setThreadStatusAction({
      threadId: thread.id,
      status: resolved ? "OPEN" : "RESOLVED",
    });
    setBusy(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(resolved ? texts.comments.reopened : texts.comments.resolved);
    await onChanged();
  }

  async function handleEditSave() {
    if (!editingId) return;
    setBusy(true);
    const result = await editCommentAction({
      commentId: editingId,
      body: editingBody,
    });
    setBusy(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setEditingId(null);
    await onChanged();
  }

  async function handleDeleteComment() {
    if (!commentToDelete) return;
    setBusy(true);
    const result = await deleteCommentAction({
      commentId: commentToDelete.id,
    });
    setBusy(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setCommentToDelete(null);
    await onChanged();
  }

  async function handleDeleteThread() {
    setBusy(true);
    const result = await deleteThreadAction({ threadId: thread.id });
    setBusy(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setThreadDeleteOpen(false);
    await onChanged();
  }

  return (
    <article
      id={`thread-${thread.id}`}
      className={cn(
        "bg-card flex flex-col gap-3 rounded-xl border p-4",
        resolved && "bg-muted/15",
        highlighted && "ring-primary/40 bg-accent/25 ring-2",
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-[10.5px]">
          <RelativeDate isoDate={thread.createdAt} /> ·{" "}
          {texts.comments.messageCount(thread.comments.length)}
        </p>

        <div className="flex shrink-0 items-center gap-1">
          <Badge variant={resolved ? "outline" : "secondary"}>
            {texts.comments.status[thread.status]}
          </Badge>
          {canComment && (canResolve || canDeleteThread) ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={texts.comments.threadMenu}
                    className="text-muted-foreground/70"
                  />
                }
              >
                <MoreHorizontalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {canResolve ? (
                  <DropdownMenuItem
                    disabled={busy}
                    onClick={() => void handleToggleStatus()}
                  >
                    {resolved ? <RotateCcwIcon /> : <CheckCircle2Icon />}
                    {resolved ? texts.comments.reopen : texts.comments.resolve}
                  </DropdownMenuItem>
                ) : null}
                {canDeleteThread ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setThreadDeleteOpen(true)}
                    >
                      <Trash2Icon /> {texts.comments.delete}
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </header>

      {thread.anchor?.quote ? (
        <p className="bg-muted/25 text-muted-foreground flex gap-2 rounded-md px-2.5 py-2 text-[11.5px] leading-relaxed italic">
          <QuoteIcon className="text-muted-foreground/50 mt-0.5 size-3 shrink-0" />
          <span>«{thread.anchor.quote}»</span>
        </p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {thread.comments.map((comment) => (
          <li key={comment.id} className="group/comment flex gap-2.5">
            <CommentAvatar name={comment.authorName} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-[12px] font-medium">
                  {comment.authorName ?? texts.comments.deletedUser}
                </span>
                <span className="text-muted-foreground text-[10.5px]">
                  <RelativeDate isoDate={comment.createdAt} />
                  {comment.edited ? ` · ${texts.comments.edited}` : ""}
                </span>
                {comment.authorId === currentUserId && canComment ? (
                  <span className="ml-auto flex items-center gap-0.5 opacity-60 transition-opacity group-hover/comment:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={texts.comments.edit}
                      className="text-muted-foreground/70"
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditingBody(comment.body);
                      }}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={texts.comments.delete}
                      className="text-muted-foreground/70 hover:text-destructive"
                      onClick={() => setCommentToDelete(comment)}
                    >
                      <Trash2Icon />
                    </Button>
                  </span>
                ) : null}
              </div>

              {editingId === comment.id ? (
                <div className="flex flex-col gap-1.5">
                  <MentionTextarea
                    value={editingBody}
                    onChange={setEditingBody}
                    members={members}
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-1.5">
                    <Button
                      size="xs"
                      disabled={busy || editingBody.trim().length === 0}
                      onClick={() => void handleEditSave()}
                    >
                      {texts.common.save}
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      {texts.common.cancel}
                    </Button>
                  </div>
                </div>
              ) : (
                <CommentBody body={comment.body} members={members} />
              )}
            </div>
          </li>
        ))}
      </ul>

      {resolved && thread.resolvedByName ? (
        <p className="text-muted-foreground text-[10.5px] font-medium tracking-[0.06em] uppercase">
          {texts.comments.resolvedBy(thread.resolvedByName)}
        </p>
      ) : null}

      {canComment && !resolved ? (
        <div className="flex flex-col gap-2 border-t pt-3">
          <MentionTextarea
            value={reply}
            onChange={setReply}
            members={members}
            rows={1}
            placeholder={texts.comments.replyPlaceholder}
            onSubmit={() => void handleReply()}
          />
          <div className="flex justify-end">
            <Button
              size="xs"
              disabled={sending || reply.trim().length === 0}
              onClick={() => void handleReply()}
            >
              {texts.comments.reply}
            </Button>
          </div>
        </div>
      ) : null}

      {commentToDelete ? (
        <ConfirmDialog
          onOpenChange={(open) => !open && setCommentToDelete(null)}
          title={texts.comments.deleteCommentTitle}
          description={texts.comments.deleteCommentDescription}
          confirmLabel={texts.comments.deleteCommentConfirm}
          pending={busy}
          onConfirm={() => void handleDeleteComment()}
        />
      ) : null}

      {threadDeleteOpen ? (
        <ConfirmDialog
          onOpenChange={(open) => !open && setThreadDeleteOpen(false)}
          title={texts.comments.deleteThreadTitle}
          description={texts.comments.deleteThreadDescription}
          confirmLabel={texts.comments.deleteThreadConfirm}
          pending={busy}
          onConfirm={() => void handleDeleteThread()}
        />
      ) : null}
    </article>
  );
}
