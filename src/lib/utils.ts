export { cn } from "cn";

/** Ruta interna segura para redirecciones post-login (evita open redirects). */
export function safeNextPath(value: string | null | undefined): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}
