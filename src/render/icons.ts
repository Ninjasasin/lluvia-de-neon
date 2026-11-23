import type { PowerType } from '../game/types';

/** Trazos de un icono en una cuadrícula de 24 × 24. Se usan tanto en SVG (React) como en Canvas. */
export interface IconDef {
  fill: string[];
  stroke: string[];
}

export const POWER_ICONS: Record<PowerType, IconDef> = {
  freeze: {
    fill: [],
    stroke: [
      'M12 2v20M3.3 7l17.4 10M3.3 17l17.4-10',
      'M9.4 4.4 12 7l2.6-2.6M9.4 19.6 12 17l2.6 2.6',
      'M3.6 11.2l3.5-.9-.9-3.5M20.4 12.8l-3.5.9.9 3.5',
      'M6.2 17.2l.9-3.5-3.5-.9M17.8 6.8l-.9 3.5 3.5.9',
    ],
  },
  slow: {
    fill: ['M8.6 20.5c0-1.9 3.4-2.9 3.4-2.9s3.4 1 3.4 2.9z', 'M10.2 8.2h3.6L12 10.4z'],
    stroke: [
      'M6 2.5h12M6 21.5h12',
      'M7.5 2.5v3.2c0 3 4.5 4.3 4.5 6.3s-4.5 3.3-4.5 6.3v3.2',
      'M16.5 2.5v3.2c0 3-4.5 4.3-4.5 6.3s4.5 3.3 4.5 6.3v3.2',
    ],
  },
  lightning: {
    fill: ['M13.5 1.5 4.5 13.5h5.6L8.6 22.5l10.9-13h-6z'],
    stroke: [],
  },
  bomb: {
    fill: ['M10 22.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15z', 'M12.2 6.4l2.4-2.4 3 3-2.4 2.4z'],
    stroke: ['M16.6 5.4c.8-1.9 2.4-2.6 4-2', 'M21.4 1.2v1.4M22.8 4.2h-1.3M19.4 1.6l.8.9'],
  },
};

const pathCache = new Map<PowerType, { fill: Path2D[]; stroke: Path2D[] }>();

function paths(type: PowerType) {
  let cached = pathCache.get(type);
  if (!cached) {
    const def = POWER_ICONS[type];
    cached = {
      fill: def.fill.map((d) => new Path2D(d)),
      stroke: def.stroke.map((d) => new Path2D(d)),
    };
    pathCache.set(type, cached);
  }
  return cached;
}

/** Dibuja el icono de un poder centrado en (cx, cy). */
export function drawPowerIcon(
  ctx: CanvasRenderingContext2D,
  type: PowerType,
  cx: number,
  cy: number,
  size: number,
  color: string,
): void {
  const icon = paths(type);
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(size / 24, size / 24);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const p of icon.fill) ctx.fill(p);
  for (const p of icon.stroke) ctx.stroke(p);
  ctx.restore();
}
