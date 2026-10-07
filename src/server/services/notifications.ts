import type { NotificationType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/errors";
import { parseInput } from "@/server/validators/common";
import {
  listNotificationsSchema,
  notificationIdSchema,
} from "@/server/validators/comments";

/** Contenido del `payload` jsonb (docs/05). */
export type NotificationPayload = {
  projectId?: string;
  documentId?: string;
  threadId?: string;
  commentId?: string;
  actorId?: string;
  snippet?: string;
  role?: string;
};

export type NotificationView = {
  id: string;
  type: NotificationType;
  payload: NotificationPayload;
  read: boolean;
  createdAt: string;
  /** Enlace directo al origen (RF-902); `null` si ya no existe. */
  href: string | null;
  actorName: string | null;
  projectName: string | null;
  documentTitle: string | null;
};

export type NotificationPage = {
  items: NotificationView[];
  nextCursor: string | null;
  unreadCount: number;
};

function parsePayload(value: unknown): NotificationPayload {
  if (typeof value !== "object" || value === null) return {};
  const raw = value as Record<string, unknown>;
  const payload: NotificationPayload = {};
  for (const key of [
    "projectId",
    "documentId",
    "threadId",
    "commentId",
    "actorId",
    "snippet",
    "role",
  ] as const) {
    const field = raw[key];
    if (typeof field === "string") {
      payload[key] = field;
    }
  }
  return payload;
}

function buildHref(
  type: NotificationType,
  payload: NotificationPayload,
): string | null {
  if (type === "PROJECT_DELETED") return null;
  if (payload.projectId && payload.documentId) {
    const hash = payload.threadId ? `#thread-${payload.threadId}` : "";
    return `/projects/${payload.projectId}/documents/${payload.documentId}${hash}`;
  }
  if (payload.projectId) {
    return `/projects/${payload.projectId}`;
  }
  return null;
}

function unique(values: (string | undefined)[]): string[] {
  return [
    ...new Set(values.filter((value): value is string => Boolean(value))),
  ];
}

/** Lista paginada con contador de no leídas (RF-902, RF-904). */
export async function listNotifications(
  userId: string,
  input: unknown,
): Promise<NotificationPage> {
  const { cursor, limit } = parseInput(listNotificationsSchema, input);

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  const hasMore = notifications.length > limit;
  const page = hasMore ? notifications.slice(0, limit) : notifications;
  const payloads = page.map((notification) =>
    parsePayload(notification.payload),
  );

  const actorIds = unique(payloads.map((payload) => payload.actorId));
  const projectIds = unique(payloads.map((payload) => payload.projectId));
  const documentIds = unique(payloads.map((payload) => payload.documentId));

  const [actors, projects, documents] = await Promise.all([
    actorIds.length
      ? prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    projectIds.length
      ? prisma.project.findMany({
          where: { id: { in: projectIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    documentIds.length
      ? prisma.document.findMany({
          where: { id: { in: documentIds } },
          select: { id: true, title: true },
        })
      : Promise.resolve([]),
  ]);

  const actorNames = new Map(actors.map((actor) => [actor.id, actor.name]));
  const projectNames = new Map(
    projects.map((project) => [project.id, project.name]),
  );
  const documentTitles = new Map(
    documents.map((document) => [document.id, document.title]),
  );

  const items: NotificationView[] = page.map((notification) => {
    const payload = parsePayload(notification.payload);
    return {
      id: notification.id,
      type: notification.type,
      payload,
      read: notification.readAt !== null,
      createdAt: notification.createdAt.toISOString(),
      href: buildHref(notification.type, payload),
      actorName: payload.actorId
        ? (actorNames.get(payload.actorId) ?? null)
        : null,
      projectName: payload.projectId
        ? (projectNames.get(payload.projectId) ?? null)
        : null,
      documentTitle: payload.documentId
        ? (documentTitles.get(payload.documentId) ?? null)
        : null,
    };
  });

  return {
    items,
    nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    unreadCount,
  };
}

/** Marcar una notificación como leída (RF-903). */
export async function markNotificationRead(userId: string, input: unknown) {
  const { notificationId } = parseInput(notificationIdSchema, input);

  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
    select: { id: true, readAt: true },
  });
  if (!notification) {
    throw new AppError("NOT_FOUND", "La notificación no existe.");
  }
  if (!notification.readAt) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }
  return { notificationId };
}

/** Marcar todas como leídas (RF-903). */
export async function markAllNotificationsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { count: result.count };
}
