"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArchiveIcon,
  AtSignIcon,
  BellOffIcon,
  CheckCheckIcon,
  CheckIcon,
  Loader2Icon,
  MessageSquareIcon,
  ReplyIcon,
  ShieldIcon,
  Trash2Icon,
  UserPlusIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { NOTIFICATIONS_CHANGED_EVENT } from "@/components/notifications/events";
import { RelativeDate } from "@/components/relative-date";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { texts } from "@/lib/texts";
import { cn } from "@/lib/utils";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/server/actions/notifications";
import type { NotificationView } from "@/server/services/notifications";

const ICONS: Record<NotificationView["type"], LucideIcon> = {
  PROJECT_ADDED: UserPlusIcon,
  PROJECT_ARCHIVED: ArchiveIcon,
  PROJECT_DELETED: Trash2Icon,
  ROLE_CHANGED: ShieldIcon,
  COMMENT_NEW: MessageSquareIcon,
  THREAD_REPLY: ReplyIcon,
  MENTION: AtSignIcon,
};

function typeText(item: NotificationView): string {
  const actor = item.actorName ?? texts.notifications.unknownActor;
  switch (item.type) {
    case "PROJECT_ADDED":
      return texts.notifications.types.PROJECT_ADDED(actor);
    case "PROJECT_ARCHIVED":
      return texts.notifications.types.PROJECT_ARCHIVED(actor);
    case "PROJECT_DELETED":
      return texts.notifications.types.PROJECT_DELETED(actor);
    case "ROLE_CHANGED": {
      const role = item.payload.role;
      const roleLabel =
        role && role in texts.roles
          ? texts.roles[role as keyof typeof texts.roles]
          : "";
      return texts.notifications.types.ROLE_CHANGED(actor, roleLabel);
    }
    case "COMMENT_NEW":
      return texts.notifications.types.COMMENT_NEW(actor);
    case "THREAD_REPLY":
      return texts.notifications.types.THREAD_REPLY(actor);
    case "MENTION":
      return texts.notifications.types.MENTION(actor);
  }
}

/** Lista de notificaciones con marcar leída / todas (RF-902, RF-903). */
export function NotificationsList({
  initialItems,
  initialCursor,
}: {
  initialItems: NotificationView[];
  initialCursor: string | null;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busy, setBusy] = useState(false);

  const unreadCount = items.filter((item) => !item.read).length;

  async function markRead(id: string) {
    const result = await markNotificationReadAction({ notificationId: id });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
  }

  async function markAllRead() {
    setBusy(true);
    const result = await markAllNotificationsReadAction();
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
  }

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const response = await fetch(
        `/api/notifications?cursor=${encodeURIComponent(cursor)}&limit=20`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        toast.error(texts.common.unexpectedError);
        return;
      }
      const data = (await response.json()) as {
        items: NotificationView[];
        nextCursor: string | null;
      };
      setItems((current) => [...current, ...data.items]);
      setCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={BellOffIcon}
        title={texts.notifications.empty}
        description={texts.notifications.emptyDescription}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <p className="micro text-muted-foreground">
          {unreadCount > 0
            ? texts.notifications.unreadCount(unreadCount)
            : texts.notifications.allRead}
        </p>
        {unreadCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => void markAllRead()}
          >
            {busy ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <CheckCheckIcon />
            )}
            {texts.notifications.markAllRead}
          </Button>
        ) : null}
      </div>

      <ul className="bg-card divide-y overflow-hidden rounded-xl border">
        {items.map((item) => {
          const Icon = ICONS[item.type];
          return (
            <li
              key={item.id}
              className={cn(
                "relative flex items-start gap-3 px-4 py-3.5 transition-colors",
                item.href && "hover:bg-muted/40",
                !item.read && "bg-accent/25",
              )}
            >
              {!item.read ? (
                <span
                  aria-hidden
                  className="bg-primary absolute inset-y-3 left-0 w-[2px] rounded-full"
                />
              ) : null}

              <div className="bg-muted/50 flex size-8 shrink-0 items-center justify-center rounded-md border">
                <Icon className="text-muted-foreground size-4" />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-start gap-2">
                  <p className="text-[13.5px] leading-snug">{typeText(item)}</p>
                  {!item.read ? (
                    <span
                      className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full"
                      aria-hidden
                    />
                  ) : null}
                </div>
                {item.projectName || item.documentTitle ? (
                  <p className="text-muted-foreground truncate text-[11.5px]">
                    {[item.projectName, item.documentTitle]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
                {item.payload.snippet ? (
                  <p className="text-muted-foreground border-l-2 pl-2 text-[12px] leading-relaxed italic">
                    «{item.payload.snippet}»
                  </p>
                ) : null}
                <p className="text-muted-foreground text-[10.5px] font-medium tracking-[0.08em] uppercase">
                  <RelativeDate isoDate={item.createdAt} />
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1 self-center">
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "xs" }),
                      "after:absolute after:inset-0 after:content-['']",
                    )}
                    onClick={() => void markRead(item.id)}
                  >
                    {texts.notifications.open}
                  </Link>
                ) : null}
                {!item.read ? (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={texts.notifications.markRead}
                    className="relative z-10"
                    onClick={() => void markRead(item.id)}
                  >
                    <CheckIcon />
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {cursor ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            disabled={loadingMore}
            onClick={() => void loadMore()}
          >
            {loadingMore ? <Loader2Icon className="animate-spin" /> : null}
            {texts.notifications.loadMore}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
