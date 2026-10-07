"use client";

import type { ReactNode } from "react";

/**
 * Normaliza como `unaccent` de PostgreSQL: quita diacríticos y baja a
 * minúsculas para que «cancion» resalte «Canción» (RF-304).
 */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

type Range = { start: number; end: number };

/** Resalta en `text` todas las apariciones de los términos de búsqueda. */
export function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const normalizedText = normalize(text);
  const ranges: Range[] = [];

  for (const term of terms) {
    const needle = normalize(term);
    if (!needle) continue;
    let index = normalizedText.indexOf(needle);
    while (index !== -1) {
      ranges.push({ start: index, end: index + needle.length });
      index = normalizedText.indexOf(needle, index + needle.length);
    }
  }

  if (ranges.length === 0) {
    return <>{text}</>;
  }

  ranges.sort((a, b) => a.start - b.start);
  const merged: Range[] = [];
  for (const range of ranges) {
    const last = merged.at(-1);
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }

  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const range of merged) {
    if (range.start > cursor) {
      parts.push(text.slice(cursor, range.start));
    }
    parts.push(
      <mark
        key={range.start}
        className="bg-amber-200/70 text-inherit dark:bg-amber-400/25"
      >
        {text.slice(range.start, range.end)}
      </mark>,
    );
    cursor = range.end;
  }
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return <>{parts}</>;
}
