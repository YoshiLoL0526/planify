import type { z } from "zod";

import { AppError } from "@/server/errors";

/** Valida `input` contra un schema Zod y devuelve los datos tipados. */
export function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new AppError(
      "VALIDATION",
      result.error.issues[0]?.message ?? "Datos inválidos.",
    );
  }
  return result.data;
}
