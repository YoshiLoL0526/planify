"use client";

import { useCallback, useSyncExternalStore } from "react";

const CHANGE_EVENT = "planify:stored-state";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Preferencia de interfaz guardada en localStorage (p. ej. vista en lista o
 * cuadrícula). En servidor y en el primer render usa `fallback`.
 */
export function useStoredState<T extends string>(
  key: string,
  fallback: T,
  allowed: readonly T[],
): [T, (value: T) => void] {
  const stored = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const value =
    stored !== null && (allowed as readonly string[]).includes(stored)
      ? (stored as T)
      : fallback;

  const setValue = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // Sin almacenamiento (modo privado): la preferencia no persiste.
      }
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    [key],
  );

  return [value, setValue];
}
