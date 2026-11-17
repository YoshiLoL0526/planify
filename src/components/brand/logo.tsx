import { texts } from "@/lib/texts";
import { cn } from "@/lib/utils";

/**
 * Marca de Planify: una página con esquina doblada y un trazo de plano.
 * Vectorial y monocroma para que funcione sobre papel, tinta y en 24 px.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("size-7 shrink-0", className)}
    >
      <path
        d="M5.5 7A4.5 4.5 0 0 1 10 2.5h8.2L26.5 11v14A4.5 4.5 0 0 1 22 29.5H10A4.5 4.5 0 0 1 5.5 25z"
        fill="currentColor"
        fillOpacity="0.09"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M18.2 2.5V9a2.5 2.5 0 0 0 2.5 2.5h5.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m11 18.4 2.9 2.9 6.2-7.2"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 25h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

/** Marca completa: símbolo + wordmark. El color lo hereda del contenedor. */
export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={cn("text-primary", markClassName)} />
      <span className="text-[15px] font-semibold tracking-[-0.015em]">
        {texts.app.name}
      </span>
    </span>
  );
}
