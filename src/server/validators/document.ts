import { z } from "zod";

export const createDocumentSchema = z.object({
  projectId: z.string().min(1),
  type: z.enum(["NOTE", "DIAGRAM"]),
});

export const renameDocumentSchema = z.object({
  documentId: z.string().min(1),
  title: z
    .string()
    .trim()
    .min(1, "El título es obligatorio.")
    .max(160, "El título no puede superar los 160 caracteres."),
});

export const documentIdSchema = z.object({
  documentId: z.string().min(1),
});

/** Autoguardado de notas (RF-406, RF-407). */
export const saveNoteContentSchema = z.object({
  revision: z.number().int().nonnegative(),
  contentJson: z.looseObject({ type: z.literal("doc") }),
});
