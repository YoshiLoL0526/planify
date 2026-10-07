/** Códigos de error de aplicación (docs/07 · 7.1). */
export type AppErrorCode =
  "VALIDATION" | "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT";

export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

/** Resultado serializable de una Server Action. */
export type ActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error: string };

/** Convierte cualquier error en un mensaje en español para el usuario. */
export function toUserMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  console.error("[server] Error inesperado:", error);
  return "Ha ocurrido un error inesperado. Inténtalo de nuevo.";
}

/** Envuelve una operación de servidor en un ActionResult. */
export async function runAction<T>(
  operation: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await operation() };
  } catch (error) {
    return { ok: false, error: toUserMessage(error) };
  }
}
