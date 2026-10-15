import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// Carpetas de proyecto (RF-301): planas, agrupan documentos
// ─────────────────────────────────────────────────────────────

export const folderNameSchema = z
  .string()
  .trim()
  .min(1, "El nombre es obligatorio.")
  .max(80, "El nombre no puede superar los 80 caracteres.");

export const createFolderSchema = z.object({
  projectId: z.string().min(1),
  name: folderNameSchema,
});

export const renameFolderSchema = z.object({
  folderId: z.string().min(1),
  name: folderNameSchema,
});

export const folderIdSchema = z.object({
  folderId: z.string().min(1),
});
