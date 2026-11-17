/**
 * Paleta de lomos para proyectos y etiquetas. Son colores apagados y de la
 * misma familia de claridad, de modo que el color identifica sin competir con
 * el acento principal de la interfaz.
 */
const SPINES = [
  "oklch(0.55 0.07 262)", // azul pizarra
  "oklch(0.56 0.07 205)", // verdigrís
  "oklch(0.55 0.07 145)", // salvia
  "oklch(0.59 0.08 68)", // ocre
  "oklch(0.55 0.08 320)", // malva
  "oklch(0.57 0.08 28)", // arcilla
] as const;

export function tagSpineColor(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  }
  return SPINES[Math.abs(hash) % SPINES.length];
}

export const NEUTRAL_SPINE = "oklch(0.78 0.012 85)";
