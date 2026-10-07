import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/errors";
import { isUniqueViolation } from "@/server/prisma-errors";
import { parseInput } from "@/server/validators/common";
import {
  createFolderSchema,
  folderIdSchema,
  renameFolderSchema,
} from "@/server/validators/project";

export type FolderListItem = {
  id: string;
  name: string;
  projectCount: number;
};

/** Carpetas del usuario con número de proyectos activos (RF-301). */
export async function listFolders(userId: string): Promise<FolderListItem[]> {
  const folders = await prisma.folder.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { projects: { where: { status: "ACTIVE" } } } },
    },
  });

  return folders.map((folder) => ({
    id: folder.id,
    name: folder.name,
    projectCount: folder._count.projects,
  }));
}

/** Devuelve la carpeta del usuario o lanza NOT_FOUND. */
export async function getFolder(userId: string, folderId: string) {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId },
  });
  if (!folder) {
    throw new AppError("NOT_FOUND", "La carpeta no existe.");
  }
  return folder;
}

/** Valida que la carpeta existe y es del usuario (para entradas). */
export async function assertFolderOwned(
  userId: string,
  folderId: string,
): Promise<string> {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId },
    select: { id: true },
  });
  if (!folder) {
    throw new AppError("VALIDATION", "La carpeta no existe.");
  }
  return folder.id;
}

export async function createFolder(userId: string, input: unknown) {
  const { name } = parseInput(createFolderSchema, input);

  try {
    const folder = await prisma.folder.create({
      data: { userId, name },
      select: { id: true },
    });
    return { folderId: folder.id };
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError("CONFLICT", "Ya tienes una carpeta con ese nombre.");
    }
    throw error;
  }
}

export async function renameFolder(userId: string, input: unknown) {
  const { id, name } = parseInput(renameFolderSchema, input);
  await getFolder(userId, id);

  try {
    await prisma.folder.update({ where: { id }, data: { name } });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError("CONFLICT", "Ya tienes una carpeta con ese nombre.");
    }
    throw error;
  }

  return { folderId: id };
}

/** Eliminar carpeta no borra proyectos: quedan sin carpeta (RF-301). */
export async function deleteFolder(userId: string, input: unknown) {
  const { id } = parseInput(folderIdSchema, input);
  await getFolder(userId, id);
  await prisma.folder.delete({ where: { id } });
}
