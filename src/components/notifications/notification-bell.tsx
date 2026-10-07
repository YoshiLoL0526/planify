"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon } from "lucide-react";

import { NOTIFICATIONS_CHANGED_EVENT } from "@/components/notifications/events";
import { texts } from "@/lib/texts";
import { cn } from "@/lib/utils";

const POLL_MS = 30_000;

/** Campana con contador de no leídas y sondeo periódico (RF-902, RF-904). */
export function NotificationBell() {
  const pathname = usePathname();
  const [unread, setUnread] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/notifications?limit=1", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as { unreadCount: number };
        if (!cancelled) {
          setUnread(data.unreadCount);
        }
      } catch {
        // Sin conexión: se conserva el último valor conocido.
      }
    }

    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, load);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, load);
    };
  }, [pathname]);

  return (
    <Link
      href="/notifications"
      aria-label={texts.notifications.bell}
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-md",
        pathname.startsWith("/notifications")
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <BellIcon className="size-4" />
      {unread !== null && unread > 0 ? (
        <span className="bg-destructive absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
