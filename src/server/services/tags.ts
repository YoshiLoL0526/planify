import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/errors";
import { isUniqueViolation } from "@/server/prisma-errors";
import { parseInput } from "@/server/validators/common";
import {
  createTagSchema,
  renameTagSchema,
  tagIdSchema,
} from "@/server/validators/project";

export type TagListItem = {
  id: string;
  name: string;
  projectCount: number;
};

/** Etiquetas del usuario con número de proyectos activos (RF-302). */
export async function listTags(userId: string): Promise<TagListItem[]> {
  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: {
      projectTags: {
        where: { project: { is: { status: "ACTIVE" } } },
        select: { projectId: true },
      },
    },
  });

  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    projectCount: tag.projectTags.length,
  }));
}

export async function getTag(userId: string, tagId: string) {
  const tag = await prisma.tag.findFirst({
    where: { id: tagId, userId },
  });
  if (!tag) {
    throw new AppError("NOT_FOUND", "La etiqueta no existe.");
  }
  return tag;
}

export async function createTag(userId: string, input: unknown) {
  const { name } = parseInput(createTagSchema, input);

  try {
    const tag = await prisma.tag.create({
      data: { userId, name },
      select: { id: true },
    });
    return { tagId: tag.id };
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError("CONFLICT", "Ya tienes una etiqueta con ese nombre.");
    }
    throw error;
  }
}

export async function renameTag(userId: string, input: unknown) {
  const { id, name } = parseInput(renameTagSchema, input);
  await getTag(userId, id);

  try {
    await prisma.tag.update({ where: { id }, data: { name } });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError("CONFLICT", "Ya tienes una etiqueta con ese nombre.");
    }
    throw error;
  }

  return { tagId: id };
}

/** Eliminar etiqueta no borra proyectos: solo la quita de ellos (RF-302). */
export async function deleteTag(userId: string, input: unknown) {
  const { id } = parseInput(tagIdSchema, input);
  await getTag(userId, id);
  await prisma.tag.delete({ where: { id } });
}
