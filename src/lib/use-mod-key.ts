"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getSnapshot(): string {
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } })
      .userAgentData?.platform ?? navigator.platform;
  return /mac|iphone|ipad|ipod/i.test(platform) ? "⌘" : "Ctrl";
}

/** Tecla modificadora de los atajos: «⌘» en Apple y «Ctrl» en el resto (en servidor, «Ctrl»). */
export function useModKey(): string {
  return useSyncExternalStore(subscribe, getSnapshot, () => "Ctrl");
}
