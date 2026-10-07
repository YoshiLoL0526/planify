import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// Comentarios: hilos y mensajes (RF-701 a RF-706)
// ─────────────────────────────────────────────────────────────

export const commentBodySchema = z
  .string()
  .trim()
  .min(1, "Escribe un mensaje.")
  .max(4000, "El mensaje no puede superar los 4000 caracteres.");

/** Anclaje a un fragmento de nota (RF-701); `null` = hilo general. */
export const threadAnchorSchema = z
  .object({
    type: z.literal("note"),
    quote: z.string().trim().min(1).max(200),
  })
  .nullish();

export const threadStatusFilterSchema = z
  .enum(["open", "resolved", "all"])
  .catch("open");

export const listThreadsSchema = z.object({
  status: threadStatusFilterSchema,
});

export const createThreadSchema = z.object({
  documentId: z.string().min(1),
  body: commentBodySchema,
  anchor: threadAnchorSchema,
});

export const replyToThreadSchema = z.object({
  threadId: z.string().min(1),
  body: commentBodySchema,
});

export const updateThreadSchema = z.object({
  threadId: z.string().min(1),
  status: z.enum(["OPEN", "RESOLVED"]),
});

export const editCommentSchema = z.object({
  commentId: z.string().min(1),
  body: commentBodySchema,
});

export const commentIdSchema = z.object({
  commentId: z.string().min(1),
});

export const threadIdSchema = z.object({
  threadId: z.string().min(1),
});

// ─────────────────────────────────────────────────────────────
// Notificaciones (RF-901 a RF-904)
// ─────────────────────────────────────────────────────────────

export const listNotificationsSchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const notificationIdSchema = z.object({
  notificationId: z.string().min(1),
});
