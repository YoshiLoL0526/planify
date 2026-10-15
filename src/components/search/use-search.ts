"use client";

import { useEffect, useRef, useState } from "react";

import { texts } from "@/lib/texts";
import type { SearchResults } from "@/server/services/search";

export const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

export type SearchParams = {
  query: string;
  type: string;
  status: string;
  tagId?: string;
  /** Resultados por grupo («Ver más» sube de 50 a 200). */
  limit?: number;
};

/** Búsqueda con debounce contra /api/search; descarta respuestas obsoletas. */
export function useSearch({ query, type, status, tagId, limit }: SearchParams) {
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const requestIdRef = useRef(0);

  const trimmed = query.trim();
  const hasQuery = trimmed.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    if (!hasQuery) {
      // El render ya muestra la ayuda inicial; no hace falta tocar el estado.
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: trimmed, type, status });
        if (tagId) params.set("tagId", tagId);
        if (limit) params.set("limit", String(limit));

        const response = await fetch(`/api/search?${params.toString()}`, {
          cache: "no-store",
        });
        if (requestId !== requestIdRef.current) return;

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: { message?: string };
          } | null;
          throw new Error(body?.error?.message ?? texts.search.error);
        }

        const data = (await response.json()) as SearchResults;
        setResults(data);
        setError(null);
      } catch (searchError) {
        if (requestId !== requestIdRef.current) return;
        setError(
          searchError instanceof Error
            ? searchError.message
            : texts.search.error,
        );
        setResults(null);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [trimmed, hasQuery, type, status, tagId, limit, retryToken]);

  return {
    trimmed,
    hasQuery,
    results,
    loading,
    error,
    retry: () => setRetryToken((token) => token + 1),
  };
}
