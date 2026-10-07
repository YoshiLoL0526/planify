import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// Proyectos
// ─────────────────────────────────────────────────────────────

export const projectNameSchema = z
  .string()
  .trim()
  .min(1, "El nombre es obligatorio.")
  .max(120, "El nombre no puede superar los 120 caracteres.");

export const descriptionSchema = z
  .string()
  .trim()
  .max(2000, "La descripción no puede superar los 2000 caracteres.");

const tagIdsSchema = z.array(z.string().min(1)).max(30);

export const createProjectSchema = z.object({
  name: projectNameSchema,
  description: descriptionSchema.optional(),
  folderId: z.string().min(1).nullish(),
  tagIds: tagIdsSchema.optional(),
});

export const updateProjectSchema = z.object({
  name: projectNameSchema.optional(),
  description: descriptionSchema.optional(),
  folderId: z.string().min(1).nullish(),
  tagIds: tagIdsSchema.optional(),
});

export const updateProjectInputSchema = updateProjectSchema.extend({
  projectId: z.string().min(1),
});

export const projectIdSchema = z.object({
  projectId: z.string().min(1),
});

export const setFavoriteSchema = z.object({
  projectId: z.string().min(1),
  favorite: z.boolean(),
});

export const deleteProjectSchema = z.object({
  projectId: z.string().min(1),
  confirmName: z.string(),
});

export const projectViewSchema = z
  .enum(["active", "favorites", "recent", "archived"])
  .default("active");

export const listProjectsSchema = z.object({
  view: projectViewSchema,
  folderId: z.string().min(1).optional(),
  tagId: z.string().min(1).optional(),
  cursor: z.string().min(1).optional(),
});

export type ProjectView = z.infer<typeof projectViewSchema>;

// ─────────────────────────────────────────────────────────────
// Carpetas y etiquetas
// ─────────────────────────────────────────────────────────────

export const folderNameSchema = z
  .string()
  .trim()
  .min(1, "El nombre es obligatorio.")
  .max(80, "El nombre no puede superar los 80 caracteres.");

export const tagNameSchema = z
  .string()
  .trim()
  .min(1, "El nombre es obligatorio.")
  .max(50, "La etiqueta no puede superar los 50 caracteres.");

export const createFolderSchema = z.object({ name: folderNameSchema });
export const renameFolderSchema = z.object({
  id: z.string().min(1),
  name: folderNameSchema,
});
export const folderIdSchema = z.object({ id: z.string().min(1) });

export const createTagSchema = z.object({ name: tagNameSchema });
export const renameTagSchema = z.object({
  id: z.string().min(1),
  name: tagNameSchema,
});
export const tagIdSchema = z.object({ id: z.string().min(1) });
