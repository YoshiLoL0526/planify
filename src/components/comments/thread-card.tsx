"use client";

import { useState, type ReactNode } from "react";
import {
  CheckCircle2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { MentionTextarea } from "@/components/comments/mention-textarea";
import { ConfirmDialog } from "@/components/organization/confirm-dialog";
import { RelativeDate } from "@/components/relative-date";
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
  if (members.length === 0) {
    return <p className="text-sm whitespace-pre-wrap">{body}</p>;
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

  return <p className="text-sm whitespace-pre-wrap">{segments}</p>;
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
        "bg-card flex flex-col gap-2 rounded-lg border p-3",
        resolved && "opacity-75",
        highlighted && "ring-primary ring-2",
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {thread.authorName ?? texts.comments.deletedUser}
          </p>
          <p className="text-muted-foreground text-xs">
            <RelativeDate isoDate={thread.createdAt} /> ·{" "}
            {texts.comments.messageCount(thread.comments.length)}
          </p>
        </div>

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
        <p className="text-muted-foreground border-l-2 pl-2 text-xs italic">
          «{thread.anchor.quote}»
        </p>
      ) : null}

      <ul className="flex flex-col gap-2">
        {thread.comments.map((comment) => (
          <li key={comment.id} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">
                {comment.authorName ?? texts.comments.deletedUser}
              </span>
              <span className="text-muted-foreground text-[11px]">
                <RelativeDate isoDate={comment.createdAt} />
                {comment.edited ? ` · ${texts.comments.edited}` : ""}
              </span>
              {comment.authorId === currentUserId && canComment ? (
                <span className="ml-auto flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={texts.comments.edit}
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
          </li>
        ))}
      </ul>

      {resolved && thread.resolvedByName ? (
        <p className="text-muted-foreground text-xs">
          {texts.comments.resolvedBy(thread.resolvedByName)}
        </p>
      ) : null}

      {canComment && !resolved ? (
        <div className="flex flex-col gap-1.5 border-t pt-2">
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
