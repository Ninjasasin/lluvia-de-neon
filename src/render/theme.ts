/** Paleta del juego. */
export const COLORS = {
  navy: '#07152E',
  electric: '#00D9FF',
  white: '#FFFFFF',
  red: '#FF385C',
  yellow: '#FFD54A',
  violet: '#A855F7',
  ice: '#9BEBFF',
} as const;

/** Tipografía del sistema: gruesa, legible y disponible sin conexión. */
export const FONT_FAMILY =
  '"Segoe UI", "Trebuchet MS", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';

/** Generador pseudoaleatorio determinista (mulberry32). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convierte "#RRGGBB" en "r, g, b" para componer colores rgba(). */
export function rgbTriplet(hex: string): string {
  const value = parseInt(hex.slice(1), 16);
  return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
}

export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
