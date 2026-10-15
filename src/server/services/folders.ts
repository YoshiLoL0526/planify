import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/errors";
import { assertProjectActive, requireProjectRole } from "@/server/permissions";
import { isUniqueViolation } from "@/server/prisma-errors";
import { parseInput } from "@/server/validators/common";
import {
  createFolderSchema,
  folderIdSchema,
  renameFolderSchema,
} from "@/server/validators/folder";

export type ProjectFolderListItem = {
  id: string;
  name: string;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
};

/** Carpetas de un proyecto con número de documentos (RF-301). */
export async function listProjectFolders(
  userId: string,
  projectId: string,
): Promise<ProjectFolderListItem[]> {
  await requireProjectRole(userId, projectId, "VIEWER");

  const folders = await prisma.folder.findMany({
    where: { projectId },
    orderBy: { name: "asc" },
    include: { _count: { select: { documents: true } } },
  });

  return folders.map((folder) => ({
    id: folder.id,
    name: folder.name,
    documentCount: folder._count.documents,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
  }));
}

/** Devuelve la carpeta del proyecto o lanza NOT_FOUND (RF-301). */
export async function getProjectFolder(
  userId: string,
  projectId: string,
  folderId: string,
) {
  await requireProjectRole(userId, projectId, "VIEWER");

  const folder = await prisma.folder.findFirst({
    where: { id: folderId, projectId },
  });
  if (!folder) {
    throw new AppError("NOT_FOUND", "La carpeta no existe.");
  }
  return folder;
}

/**
 * Valida que la carpeta existe dentro del proyecto (para mover documentos).
 * No comprueba permisos: los servicios que la usan ya exigen rol de editor.
 */
export async function assertFolderInProject(
  projectId: string,
  folderId: string,
): Promise<string> {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, projectId },
    select: { id: true },
  });
  if (!folder) {
    throw new AppError("VALIDATION", "La carpeta no existe en este proyecto.");
  }
  return folder.id;
}

export async function createFolder(userId: string, input: unknown) {
  const { projectId, name } = parseInput(createFolderSchema, input);

  await requireProjectRole(userId, projectId, "EDITOR");
  await assertProjectActive(projectId);

  try {
    const folder = await prisma.folder.create({
      data: { projectId, name },
      select: { id: true },
    });
    return { folderId: folder.id };
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(
        "CONFLICT",
        "Ya existe una carpeta con ese nombre en este proyecto.",
      );
    }
    throw error;
  }
}

export async function renameFolder(userId: string, input: unknown) {
  const { folderId, name } = parseInput(renameFolderSchema, input);

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { id: true, projectId: true },
  });
  if (!folder) {
    throw new AppError("NOT_FOUND", "La carpeta no existe.");
  }

  await requireProjectRole(userId, folder.projectId, "EDITOR");
  await assertProjectActive(folder.projectId);

  try {
    await prisma.folder.update({ where: { id: folderId }, data: { name } });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(
        "CONFLICT",
        "Ya existe una carpeta con ese nombre en este proyecto.",
      );
    }
    throw error;
  }

  return { folderId };
}

/** Eliminar una carpeta no borra documentos: pasan a la raíz del proyecto. */
export async function deleteFolder(userId: string, input: unknown) {
  const { folderId } = parseInput(folderIdSchema, input);

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { id: true, projectId: true },
  });
  if (!folder) {
    throw new AppError("NOT_FOUND", "La carpeta no existe.");
  }

  await requireProjectRole(userId, folder.projectId, "EDITOR");
  await assertProjectActive(folder.projectId);

  await prisma.folder.delete({ where: { id: folderId } });
}
