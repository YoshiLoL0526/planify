/** Iniciales para el avatar (máximo 2 letras). */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? (parts.at(-1)?.charAt(0) ?? "") : "";

  return `${first}${last}`.toUpperCase() || "?";
}
