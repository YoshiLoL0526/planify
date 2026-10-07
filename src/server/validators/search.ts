import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// Búsqueda global (RF-303 a RF-306)
// ─────────────────────────────────────────────────────────────

export const searchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, "Escribe al menos 2 caracteres para buscar.")
    .max(200, "La búsqueda no puede superar los 200 caracteres."),
  type: z.enum(["all", "project", "note", "diagram"]).catch("all"),
  status: z.enum(["all", "active", "archived"]).catch("all"),
  folderId: z.string().min(1).optional(),
  tagId: z.string().min(1).optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type SearchType = SearchQuery["type"];
export type SearchStatus = SearchQuery["status"];
