/** Datos que recibe una escena para pintar una de sus capas fijas. */
export interface Painter {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  /** Unidad de escala: 1 equivale a una pantalla de unos 600 px de lado menor. */
  u: number;
  /** Generador determinista: la escena sale igual cada vez. */
  rand: () => number;
}

export interface SceneLayer {
  /** Píxeles de desplazamiento del parallax: más cuanto más cerca está la capa. */
  drift: number;
  paint(p: Painter): void;
}

/** Dibuja elementos en movimiento. `t` son los segundos transcurridos (0 si las animaciones están reducidas). */
export type Animator = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, u: number) => void;

/**
 * Un fondo completo. El cielo y las capas se pintan una sola vez en lienzos
 * auxiliares; `back` y `front` se dibujan en cada cuadro, detrás y delante de las capas.
 */
export interface Scene {
  sky(p: Painter): void;
  layers: SceneLayer[];
  /** Cantidad de estrellas que parpadean en la parte alta. */
  twinkles: number;
  back?: Animator;
  front?: Animator;
}

export const TAU = Math.PI * 2;

/** Margen extra alrededor de la pantalla para que el parallax y la vibración no dejen huecos. */
export const PAD = 28;

/** Posición en pantalla de un punto situado en la fracción `f` del ancho de una capa. */
export function layerX(f: number, w: number): number {
  return f * (w + PAD * 2) - PAD;
}

/** Número pseudoaleatorio fijo en [0, 1) para el elemento `i`. */
export function hash(i: number, k = 0): number {
  const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

export function fillSky(p: Painter, stops: readonly (readonly [number, string])[]): void {
  const gradient = p.ctx.createLinearGradient(0, 0, 0, p.h);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  p.ctx.fillStyle = gradient;
  p.ctx.fillRect(0, 0, p.w, p.h);
}

/** Estrellas fijas en la franja superior (`area` es la fracción del alto que ocupan). */
export function scatterStars(p: Painter, count: number, area: number, tint = '#BFE9FF'): void {
  const { ctx, w, h, rand } = p;
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = 0.25 + rand() * 0.6;
    ctx.fillStyle = rand() < 0.2 ? tint : '#FFFFFF';
    ctx.beginPath();
    ctx.arc(rand() * w, rand() * h * area, 0.4 + rand() * 1.1, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Resplandor circular difuso. `rgb` es "r, g, b". */
export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, alpha: number): void {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
  gradient.addColorStop(0, `rgba(${rgb}, ${alpha})`);
  gradient.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

export function disc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string | CanvasGradient): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

/**
 * Silueta de colinas o montañas que llega hasta el borde inferior.
 * `base` y `amp` son fracciones del alto; `jag` añade irregularidad.
 * Devuelve la función que da la altura del perfil en cada x.
 */
export function ridge(
  p: Painter,
  base: number,
  amp: number,
  waves: number,
  fill: string | CanvasGradient,
  jag = 0,
): (x: number) => number {
  const { ctx, w, h, rand } = p;
  const phase = [rand() * TAU, rand() * TAU, rand() * TAU];
  const f = (waves * TAU) / w;
  const step = 8;
  const jitter: number[] = [];
  for (let x = 0; x <= w + step; x += step) jitter.push((rand() - 0.5) * jag * h);
  const yAt = (x: number): number => {
    const wave =
      0.6 * Math.sin(x * f + phase[0]) + 0.3 * Math.sin(x * f * 2.3 + phase[1]) + 0.1 * Math.sin(x * f * 5.1 + phase[2]);
    const index = Math.min(jitter.length - 1, Math.max(0, Math.round(x / step)));
    return h * base - h * amp * wave + jitter[index];
  };
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w + step; x += step) ctx.lineTo(x, yAt(x));
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  return yAt;
}

/** Abeto o pino simple: tres triángulos apilados sobre un tronco. */
export function pine(ctx: CanvasRenderingContext2D, x: number, y: number, height: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x - height * 0.03, y - height * 0.2, height * 0.06, height * 0.22);
  for (let i = 0; i < 3; i++) {
    const top = y - height + i * height * 0.24;
    const half = height * (0.14 + i * 0.07);
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + half, top + height * 0.4);
    ctx.lineTo(x - half, top + height * 0.4);
    ctx.closePath();
    ctx.fill();
  }
}
