import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

/** Fecha relativa en español: «hace 2 horas», «hace 3 días»… */
export function formatRelative(isoDate: string): string {
  return formatDistanceToNow(new Date(isoDate), {
    addSuffix: true,
    locale: es,
  });
}
