import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/errors";
import { requireProjectRole } from "@/server/permissions";
import { parseInput } from "@/server/validators/common";
import {
  commentIdSchema,
  createThreadSchema,
  editCommentSchema,
  listThreadsSchema,
  replyToThreadSchema,
  threadIdSchema,
  updateThreadSchema,
} from "@/server/validators/comments";

export type CommentView = {
  id: string;
  authorId: string | null;
  authorName: string | null;
  body: string;
  edited: boolean;
  createdAt: string;
};

export type ThreadAnchor = { type: string; quote?: string } | null;

export type ThreadView = {
  id: string;
  status: "OPEN" | "RESOLVED";
  anchor: ThreadAnchor;
  authorId: string | null;
  authorName: string | null;
  resolvedByName: string | null;
  createdAt: string;
  resolvedAt: string | null;
  comments: CommentView[];
};

type MemberName = { id: string; name: string };

type NotifyTarget = "COMMENT_NEW" | "THREAD_REPLY" | "MENTION";

async function getDocumentForMember(userId: string, documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      projectId: true,
      createdById: true,
      project: { select: { status: true } },
    },
  });
  if (!document) {
    throw new AppError("NOT_FOUND", "El documento no existe.");
  }
  const membership = await requireProjectRole(
    userId,
    document.projectId,
    "VIEWER",
  );
  return { document, membership };
}

/** Los comentarios se congelan con el proyecto archivado (RF-204). */
function assertProjectActive(status: "ACTIVE" | "ARCHIVED") {
  if (status === "ARCHIVED") {
    throw new AppError(
      "CONFLICT",
      "Este proyecto está archivado. Desarchívalo para poder comentar.",
    );
  }
}

function parseAnchor(value: unknown): ThreadAnchor {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.type !== "string") return null;
  return {
    type: raw.type,
    ...(typeof raw.quote === "string" ? { quote: raw.quote } : {}),
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Miembros mencionados con `@Nombre` (RF-704). Solo se pueden mencionar
 * miembros del proyecto, así que se compara contra sus nombres.
 */
function findMentionedMemberIds(
  body: string,
  members: MemberName[],
  excludeUserId: string,
): string[] {
  const mentioned: string[] = [];
  for (const member of members) {
    if (member.id === excludeUserId) continue;
    const pattern = new RegExp(
      `(^|[^\\p{L}\\p{N}_])@${escapeRegExp(member.name)}(?=$|[^\\p{L}\\p{N}_])`,
      "iu",
    );
    if (pattern.test(body)) {
      mentioned.push(member.id);
    }
  }
  return mentioned;
}

async function getProjectMembers(projectId: string): Promise<MemberName[]> {
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    select: { userId: true, user: { select: { name: true } } },
  });
  return members.map((member) => ({
    id: member.userId,
    name: member.user.name,
  }));
}

/** Hilos del documento con sus mensajes (RF-705). Cualquier miembro. */
export async function listThreads(
  userId: string,
  documentId: string,
  input: unknown,
): Promise<ThreadView[]> {
  const { status } = parseInput(listThreadsSchema, input);
  await getDocumentForMember(userId, documentId);

  const threads = await prisma.commentThread.findMany({
    where: {
      documentId,
      ...(status === "all"
        ? {}
        : { status: status === "resolved" ? "RESOLVED" : "OPEN" }),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      author: { select: { id: true, name: true } },
      resolvedBy: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });

  return threads.map((thread) => ({
    id: thread.id,
    status: thread.status,
    anchor: parseAnchor(thread.anchor),
    authorId: thread.authorId,
    authorName: thread.author?.name ?? null,
    resolvedByName: thread.resolvedBy?.name ?? null,
    createdAt: thread.createdAt.toISOString(),
    resolvedAt: thread.resolvedAt?.toISOString() ?? null,
    comments: thread.comments.map((comment) => ({
      id: comment.id,
      authorId: comment.authorId,
      authorName: comment.author?.name ?? null,
      body: comment.body,
      edited: comment.editedAt !== null,
      createdAt: comment.createdAt.toISOString(),
    })),
  }));
}

/** Crear hilo con su primer mensaje (RF-701). Todos los roles comentan (RF-706). */
export async function createThread(userId: string, input: unknown) {
  const { documentId, body, anchor } = parseInput(createThreadSchema, input);
  const { document } = await getDocumentForMember(userId, documentId);
  assertProjectActive(document.project.status);

  const members = await getProjectMembers(document.projectId);
  const memberIds = new Set(members.map((member) => member.id));
  const mentioned = findMentionedMemberIds(body, members, userId);
  const snippet = body.slice(0, 120);

  const result = await prisma.$transaction(async (tx) => {
    const thread = await tx.commentThread.create({
      data: { documentId, authorId: userId, anchor: anchor ?? undefined },
      select: { id: true },
    });
    const comment = await tx.comment.create({
      data: { threadId: thread.id, authorId: userId, body },
      select: { id: true },
    });

    const targets = new Map<string, NotifyTarget>();
    if (
      document.createdById &&
      document.createdById !== userId &&
      memberIds.has(document.createdById)
    ) {
      targets.set(document.createdById, "COMMENT_NEW");
    }
    for (const mentionedId of mentioned) {
      targets.set(mentionedId, "MENTION");
    }

    if (targets.size > 0) {
      await tx.notification.createMany({
        data: [...targets.entries()].map(([targetId, type]) => ({
          userId: targetId,
          type,
          payload: {
            projectId: document.projectId,
            documentId,
            threadId: thread.id,
            commentId: comment.id,
            actorId: userId,
            snippet,
          },
        })),
      });
    }

    return { threadId: thread.id, commentId: comment.id };
  });

  return { ...result, projectId: document.projectId, documentId };
}

/** Responder en un hilo (RF-702). */
export async function replyToThread(userId: string, input: unknown) {
  const { threadId, body } = parseInput(replyToThreadSchema, input);

  const thread = await prisma.commentThread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      authorId: true,
      documentId: true,
      document: {
        select: {
          projectId: true,
          createdById: true,
          project: { select: { status: true } },
        },
      },
    },
  });
  if (!thread) {
    throw new AppError("NOT_FOUND", "El hilo no existe.");
  }
  await requireProjectRole(userId, thread.document.projectId, "VIEWER");
  assertProjectActive(thread.document.project.status);

  const members = await getProjectMembers(thread.document.projectId);
  const memberIds = new Set(members.map((member) => member.id));
  const mentioned = findMentionedMemberIds(body, members, userId);
  const snippet = body.slice(0, 120);

  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.comment.create({
      data: { threadId, authorId: userId, body },
      select: { id: true },
    });

    const targets = new Map<string, NotifyTarget>();
    if (
      thread.authorId &&
      thread.authorId !== userId &&
      memberIds.has(thread.authorId)
    ) {
      targets.set(thread.authorId, "THREAD_REPLY");
    }
    const creatorId = thread.document.createdById;
    if (
      creatorId &&
      creatorId !== userId &&
      memberIds.has(creatorId) &&
      !targets.has(creatorId)
    ) {
      targets.set(creatorId, "COMMENT_NEW");
    }
    for (const mentionedId of mentioned) {
      targets.set(mentionedId, "MENTION");
    }

    if (targets.size > 0) {
      await tx.notification.createMany({
        data: [...targets.entries()].map(([targetId, type]) => ({
          userId: targetId,
          type,
          payload: {
            projectId: thread.document.projectId,
            documentId: thread.documentId,
            threadId,
            commentId: created.id,
            actorId: userId,
            snippet,
          },
        })),
      });
    }

    return created;
  });

  return {
    threadId,
    commentId: comment.id,
    projectId: thread.document.projectId,
    documentId: thread.documentId,
  };
}

/** Editar el mensaje propio, marcándolo como «editado» (RF-702). */
export async function editComment(userId: string, input: unknown) {
  const { commentId, body } = parseInput(editCommentSchema, input);

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      authorId: true,
      thread: {
        select: {
          documentId: true,
          document: {
            select: { projectId: true, project: { select: { status: true } } },
          },
        },
      },
    },
  });
  if (!comment) {
    throw new AppError("NOT_FOUND", "El mensaje no existe.");
  }
  await requireProjectRole(userId, comment.thread.document.projectId, "VIEWER");
  assertProjectActive(comment.thread.document.project.status);
  if (comment.authorId !== userId) {
    throw new AppError("FORBIDDEN", "Solo puedes editar tus propios mensajes.");
  }

  await prisma.comment.update({
    where: { id: commentId },
    data: { body, editedAt: new Date() },
  });

  return {
    commentId,
    projectId: comment.thread.document.projectId,
    documentId: comment.thread.documentId,
  };
}

/** Borrar el mensaje propio; si el hilo queda vacío, se elimina (RF-702). */
export async function deleteComment(userId: string, input: unknown) {
  const { commentId } = parseInput(commentIdSchema, input);

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      authorId: true,
      threadId: true,
      thread: {
        select: {
          documentId: true,
          document: {
            select: { projectId: true, project: { select: { status: true } } },
          },
        },
      },
    },
  });
  if (!comment) {
    throw new AppError("NOT_FOUND", "El mensaje no existe.");
  }
  await requireProjectRole(userId, comment.thread.document.projectId, "VIEWER");
  assertProjectActive(comment.thread.document.project.status);
  if (comment.authorId !== userId) {
    throw new AppError("FORBIDDEN", "Solo puedes borrar tus propios mensajes.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.comment.delete({ where: { id: commentId } });
    const remaining = await tx.comment.count({
      where: { threadId: comment.threadId },
    });
    if (remaining === 0) {
      await tx.commentThread.delete({ where: { id: comment.threadId } });
    }
  });

  return {
    commentId,
    threadId: comment.threadId,
    projectId: comment.thread.document.projectId,
    documentId: comment.thread.documentId,
  };
}

/** Resolver o reabrir un hilo (RF-703, RF-706). */
export async function setThreadStatus(userId: string, input: unknown) {
  const { threadId, status } = parseInput(updateThreadSchema, input);

  const thread = await prisma.commentThread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      authorId: true,
      documentId: true,
      document: {
        select: { projectId: true, project: { select: { status: true } } },
      },
    },
  });
  if (!thread) {
    throw new AppError("NOT_FOUND", "El hilo no existe.");
  }
  const membership = await requireProjectRole(
    userId,
    thread.document.projectId,
    "VIEWER",
  );
  assertProjectActive(thread.document.project.status);

  const canResolve =
    thread.authorId === userId ||
    membership.role === "EDITOR" ||
    membership.role === "OWNER";
  if (!canResolve) {
    throw new AppError(
      "FORBIDDEN",
      "Solo el autor del hilo, un editor o el propietario pueden resolverlo.",
    );
  }

  await prisma.commentThread.update({
    where: { id: threadId },
    data:
      status === "RESOLVED"
        ? { status: "RESOLVED", resolvedAt: new Date(), resolvedById: userId }
        : { status: "OPEN", resolvedAt: null, resolvedById: null },
  });

  return {
    threadId,
    status,
    projectId: thread.document.projectId,
    documentId: thread.documentId,
  };
}

/** Eliminar el hilo completo: su autor o el propietario (RF-702). */
export async function deleteThread(userId: string, input: unknown) {
  const { threadId } = parseInput(threadIdSchema, input);

  const thread = await prisma.commentThread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      authorId: true,
      documentId: true,
      document: {
        select: { projectId: true, project: { select: { status: true } } },
      },
    },
  });
  if (!thread) {
    throw new AppError("NOT_FOUND", "El hilo no existe.");
  }
  const membership = await requireProjectRole(
    userId,
    thread.document.projectId,
    "VIEWER",
  );
  assertProjectActive(thread.document.project.status);

  const canDelete = thread.authorId === userId || membership.role === "OWNER";
  if (!canDelete) {
    throw new AppError(
      "FORBIDDEN",
      "Solo el autor del hilo o el propietario pueden eliminarlo.",
    );
  }

  await prisma.commentThread.delete({ where: { id: threadId } });

  return {
    threadId,
    projectId: thread.document.projectId,
    documentId: thread.documentId,
  };
}
