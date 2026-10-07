import type { Metadata } from "next";

import { NotificationsList } from "@/components/notifications/notifications-list";
import { requireSession } from "@/lib/session";
import { texts } from "@/lib/texts";
import { listNotifications } from "@/server/services/notifications";

export const metadata: Metadata = {
  title: texts.notifications.title,
};

/** Centro de notificaciones (RF-902, RF-903). */
export default async function NotificationsPage() {
  const session = await requireSession();
  const page = await listNotifications(session.user.id, { limit: 20 });

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="font-heading text-2xl font-semibold">
        {texts.notifications.title}
      </h1>

      <NotificationsList
        initialItems={page.items}
        initialCursor={page.nextCursor}
      />
    </div>
  );
}
