/**
 * Extracción de texto plano del JSON de Tiptap (RF-506).
 * Se usa para alimentar la búsqueda global sin exponer el HTML.
 */

type JsonNode = {
  type?: string;
  text?: string;
  content?: unknown;
};

export const MAX_CONTENT_TEXT_LENGTH = 500_000;

export function extractPlainText(document: unknown): string {
  const parts: string[] = [];
  walk(document, parts);
  return parts
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_CONTENT_TEXT_LENGTH);
}

function walk(node: unknown, parts: string[]): void {
  if (typeof node !== "object" || node === null) {
    return;
  }

  const typed = node as JsonNode;
  if (typeof typed.text === "string") {
    parts.push(typed.text);
  }

  if (Array.isArray(typed.content)) {
    for (const child of typed.content) {
      walk(child, parts);
    }
  }
}
