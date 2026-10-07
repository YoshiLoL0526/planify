"use client";

import { useEffect, useState } from "react";

import { formatRelative } from "@/lib/dates";
import { cn } from "@/lib/utils";

/**
 * Fecha relativa («hace 2 minutos») que se recalcula en el cliente tras montar
 * y cada minuto. Evita desajustes de hidratación cuando el minuto cambia entre
 * el renderizado en servidor y la hidratación (p. ej. en listas SSR + cliente).
 */
export function RelativeDate({
  isoDate,
  className,
}: {
  isoDate: string;
  className?: string;
}) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setText(formatRelative(isoDate));
    const initial = setTimeout(update, 0);
    const timer = setInterval(update, 60_000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [isoDate]);

  return (
    <span className={cn(className)} suppressHydrationWarning>
      {text ?? formatRelative(isoDate)}
    </span>
  );
}
