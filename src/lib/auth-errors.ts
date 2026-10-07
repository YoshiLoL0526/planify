import { texts } from "@/lib/texts";

/** Traducción de los códigos de error de better-auth al español. */
const ERROR_MESSAGES: Record<string, string> = {
  USER_NOT_FOUND: "No existe ninguna cuenta con ese email.",
  INVALID_EMAIL_OR_PASSWORD: "Email o contraseña incorrectos.",
  INVALID_PASSWORD: "Contraseña incorrecta.",
  INVALID_EMAIL: "El email no tiene un formato válido.",
  PASSWORD_TOO_SHORT: "La contraseña debe tener al menos 8 caracteres.",
  PASSWORD_TOO_LONG: "La contraseña es demasiado larga.",
  USER_ALREADY_EXISTS: "Ese email ya tiene una cuenta. Inicia sesión.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "Ese email ya tiene una cuenta. Inicia sesión o usa otro email.",
  EMAIL_PASSWORD_SIGN_UP_DISABLED:
    "El registro está cerrado. Pide una invitación al administrador.",
  FAILED_TO_CREATE_USER: "No se pudo crear la cuenta. Inténtalo de nuevo.",
  FAILED_TO_CREATE_SESSION: "No se pudo iniciar la sesión. Inténtalo de nuevo.",
  SESSION_EXPIRED: "Tu sesión ha caducado. Vuelve a iniciar sesión.",
  INVALID_TOKEN: "El enlace no es válido o ha caducado.",
  TOKEN_EXPIRED: "El enlace ha caducado.",
  VALIDATION_ERROR: "Revisa los datos introducidos.",
  MISSING_FIELD: "Faltan campos por rellenar.",
};

/** Convierte el error de better-auth en un mensaje en español para el usuario. */
export function authErrorMessage(error: unknown): string {
  if (typeof error !== "object" || error === null) {
    return texts.common.unexpectedError;
  }

  const code =
    "code" in error && typeof error.code === "string" ? error.code : undefined;
  const status =
    "status" in error && typeof error.status === "number"
      ? error.status
      : undefined;

  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }
  if (status === 429) {
    return texts.common.tooManyAttempts;
  }
  return texts.common.unexpectedError;
}
