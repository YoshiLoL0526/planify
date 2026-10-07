import type { Prisma } from "@/generated/prisma/client";
import type { ProjectRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/errors";
import { requireProjectRole } from "@/server/permissions";
import { parseInput } from "@/server/validators/common";
import {
  createProjectSchema,
  deleteProjectSchema,
  listProjectsSchema,
  projectIdSchema,
  setFavoriteSchema,
  updateProjectInputSchema,
} from "@/server/validators/project";
import { assertFolderOwned, getFolder } from "@/server/services/folders";

const PAGE_SIZE = 24;

export type ProjectListItem = {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "ARCHIVED";
  favorite: boolean;
  role: ProjectRole;
  folderId: string | null;
  updatedAt: string;
  documentCount: number;
  memberCount: number;
  members: { id: string; name: string }[];
  tagIds: string[];
};

export type ProjectListPage = {
  items: ProjectListItem[];
  nextCursor: string | null;
};

export type ProjectDetail = Omit<ProjectListItem, "members"> & {
  ownerId: string;
  createdAt: string;
  members: { id: string; name: string; role: ProjectRole }[];
};

/** Comprueba que todas las etiquetas pertenecen al usuario. */
async function assertOwnedTags(
  userId: string,
  tagIds: string[],
): Promise<string[]> {
  const unique = [...new Set(tagIds)];
  if (unique.length === 0) return [];

  const tags = await prisma.tag.findMany({
    where: { id: { in: unique }, userId },
    select: { id: true },
  });
  if (tags.length !== unique.length) {
    throw new AppError("VALIDATION", "Alguna de las etiquetas no existe.");
  }
  return unique;
}

/**
 * Lista paginada de proyectos del usuario (propios y compartidos).
 * Ver RF-202, RF-206, RF-207, RF-304 y RF-305.
 */
export async function listProjects(
  userId: string,
  input: unknown,
): Promise<ProjectListPage> {
  const { view, folderId, tagId, cursor } = parseInput(
    listProjectsSchema,
    input,
  );

  if (folderId) {
    await getFolder(userId, folderId);
  }
  if (tagId) {
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, userId },
      select: { id: true },
    });
    if (!tag) {
      throw new AppError("NOT_FOUND", "La etiqueta no existe.");
    }
  }

  const projectFilter: Prisma.ProjectWhereInput = {
    status: view === "archived" ? "ARCHIVED" : "ACTIVE",
  };
  if (folderId) projectFilter.folderId = folderId;
  if (tagId) projectFilter.tags = { some: { tagId } };

  const where: Prisma.ProjectMemberWhereInput = {
    userId,
    project: { is: projectFilter },
  };
  if (view === "favorites") where.favorite = true;
  if (view === "recent") where.lastOpenedAt = { not: null };

  const orderBy: Prisma.ProjectMemberOrderByWithRelationInput[] =
    view === "recent"
      ? [{ lastOpenedAt: "desc" }, { id: "desc" }]
      : view === "archived"
        ? [{ project: { archivedAt: "desc" } }, { id: "desc" }]
        : [{ project: { updatedAt: "desc" } }, { id: "desc" }];

  const memberships = await prisma.projectMember.findMany({
    where,
    orderBy,
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      project: {
        include: {
          _count: { select: { documents: true, members: true } },
          members: {
            orderBy: { createdAt: "asc" },
            take: 5,
            select: { user: { select: { id: true, name: true } } },
          },
          tags: {
            where: { tag: { is: { userId } } },
            select: { tagId: true },
          },
        },
      },
    },
  });

  const hasMore = memberships.length > PAGE_SIZE;
  const page = hasMore ? memberships.slice(0, PAGE_SIZE) : memberships;

  return {
    items: page.map((membership) => ({
      id: membership.project.id,
      name: membership.project.name,
      description: membership.project.description,
      status: membership.project.status,
      favorite: membership.favorite,
      role: membership.role,
      folderId: membership.project.folderId,
      updatedAt: membership.project.updatedAt.toISOString(),
      documentCount: membership.project._count.documents,
      memberCount: membership.project._count.members,
      members: membership.project.members.map((member) => member.user),
      tagIds: membership.project.tags.map((tag) => tag.tagId),
    })),
    nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
  };
}

/** Detalle de un proyecto con el rol del usuario (RF-202). */
export async function getProjectView(
  userId: string,
  projectId: string,
): Promise<ProjectDetail> {
  const membership = await requireProjectRole(userId, projectId, "VIEWER");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      _count: { select: { documents: true, members: true } },
      members: {
        orderBy: { createdAt: "asc" },
        select: {
          role: true,
          user: { select: { id: true, name: true } },
        },
      },
      tags: {
        where: { tag: { is: { userId } } },
        select: { tagId: true },
      },
    },
  });

  if (!project) {
    throw new AppError("NOT_FOUND", "El proyecto no existe.");
  }

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    favorite: membership.favorite,
    role: membership.role,
    ownerId: project.ownerId,
    folderId: project.folderId,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    documentCount: project._count.documents,
    memberCount: project._count.members,
    members: project.members.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      role: member.role,
    })),
    tagIds: project.tags.map((tag) => tag.tagId),
  };
}

/** Crear proyecto: el creador pasa a ser OWNER (RF-201). */
export async function createProject(userId: string, input: unknown) {
  const data = parseInput(createProjectSchema, input);

  let folderId: string | null = null;
  if (data.folderId) {
    folderId = await assertFolderOwned(userId, data.folderId);
  }

  const tagIds = data.tagIds?.length
    ? await assertOwnedTags(userId, data.tagIds)
    : [];

  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description?.length ? data.description : null,
      ownerId: userId,
      folderId,
      members: { create: { userId, role: "OWNER" } },
      tags: tagIds.length
        ? { create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
    select: { id: true },
  });

  return { projectId: project.id };
}

/** Editar nombre/descripción, carpeta (owner) y etiquetas propias (RF-203, RF-208, RF-209). */
export async function updateProject(userId: string, input: unknown) {
  const { projectId, ...data } = parseInput(updateProjectInputSchema, input);

  const membership = await requireProjectRole(userId, projectId, "EDITOR");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  });
  if (!project) {
    throw new AppError("NOT_FOUND", "El proyecto no existe.");
  }

  const update: Prisma.ProjectUpdateInput = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.description !== undefined) {
    update.description = data.description.length ? data.description : null;
  }

  if (data.folderId !== undefined) {
    // La carpeta es personal del propietario: solo él mueve el proyecto.
    if (membership.role !== "OWNER") {
      throw new AppError(
        "FORBIDDEN",
        "Solo el propietario puede mover el proyecto de carpeta.",
      );
    }
    if (data.folderId) {
      const folderId = await assertFolderOwned(project.ownerId, data.folderId);
      update.folder = { connect: { id: folderId } };
    } else {
      update.folder = { disconnect: true };
    }
  }

  let tagIds: string[] | undefined;
  if (data.tagIds !== undefined) {
    tagIds = await assertOwnedTags(userId, data.tagIds);
  }

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: projectId },
      data: { ...update, updatedAt: new Date() },
    });

    if (tagIds !== undefined) {
      await tx.projectTag.deleteMany({
        where: { projectId, tag: { is: { userId } } },
      });
      if (tagIds.length) {
        await tx.projectTag.createMany({
          data: tagIds.map((tagId) => ({ projectId, tagId })),
        });
      }
    }
  });

  return { projectId };
}

/** Marcar/desmarcar favorito (RF-206). Cualquier miembro. */
export async function setFavorite(userId: string, input: unknown) {
  const { projectId, favorite } = parseInput(setFavoriteSchema, input);
  await requireProjectRole(userId, projectId, "VIEWER");

  await prisma.projectMember.update({
    where: { projectId_userId: { projectId, userId } },
    data: { favorite },
  });

  return { projectId, favorite };
}

/** Registrar última apertura para «Recientes» (RF-207). */
export async function touchProject(userId: string, input: unknown) {
  const { projectId } = parseInput(projectIdSchema, input);
  await requireProjectRole(userId, projectId, "VIEWER");

  await prisma.projectMember.update({
    where: { projectId_userId: { projectId, userId } },
    data: { lastOpenedAt: new Date() },
  });
}

/** Archivar / desarchivar (RF-204). Solo owner. Notifica a los miembros (RF-901). */
export async function archiveProject(userId: string, input: unknown) {
  const { projectId } = parseInput(projectIdSchema, input);
  await requireProjectRole(userId, projectId, "OWNER");

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: projectId },
      data: { status: "ARCHIVED", archivedAt: new Date() },
    });

    const members = await tx.projectMember.findMany({
      where: { projectId, userId: { not: userId } },
      select: { userId: true },
    });
    if (members.length > 0) {
      await tx.notification.createMany({
        data: members.map((member) => ({
          userId: member.userId,
          type: "PROJECT_ARCHIVED" as const,
          payload: { projectId, actorId: userId },
        })),
      });
    }
  });
}

export async function unarchiveProject(userId: string, input: unknown) {
  const { projectId } = parseInput(projectIdSchema, input);
  await requireProjectRole(userId, projectId, "OWNER");

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "ACTIVE", archivedAt: null },
  });
}

/** Eliminar con confirmación por nombre (RF-205). Solo owner. */
export async function deleteProject(userId: string, input: unknown) {
  const { projectId, confirmName } = parseInput(deleteProjectSchema, input);
  await requireProjectRole(userId, projectId, "OWNER");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  });
  if (!project) {
    throw new AppError("NOT_FOUND", "El proyecto no existe.");
  }
  if (confirmName.trim() !== project.name) {
    throw new AppError(
      "VALIDATION",
      "El nombre no coincide con el del proyecto.",
    );
  }

  await prisma.$transaction(async (tx) => {
    // Limpia las notificaciones que apuntan al proyecto (evita enlaces rotos).
    await tx.notification.deleteMany({
      where: { payload: { path: ["projectId"], equals: projectId } },
    });

    const members = await tx.projectMember.findMany({
      where: { projectId, userId: { not: userId } },
      select: { userId: true },
    });
    if (members.length > 0) {
      await tx.notification.createMany({
        data: members.map((member) => ({
          userId: member.userId,
          type: "PROJECT_DELETED" as const,
          payload: { projectId, actorId: userId },
        })),
      });
    }

    await tx.project.delete({ where: { id: projectId } });
  });
}
