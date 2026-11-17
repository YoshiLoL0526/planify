import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
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
    <PageContainer>
      <PageHeader title={texts.notifications.title} />
      <NotificationsList
        initialItems={page.items}
        initialCursor={page.nextCursor}
      />
    </PageContainer>
  );
}
