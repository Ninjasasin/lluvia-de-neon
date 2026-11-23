import { TAU, disc, fillSky, glow, scatterStars, type Painter, type Scene } from './common';

interface SkylineSpec {
  minH: number;
  maxH: number;
  minW: number;
  maxW: number;
  color: string;
  edge: string;
  windows: string[];
  windowChance: number;
}

function skyline(p: Painter, spec: SkylineSpec): void {
  const { ctx, w, h, rand } = p;
  const s = Math.max(0.6, p.u);
  let x = -10;
  while (x < w) {
    const bw = (spec.minW + rand() * (spec.maxW - spec.minW)) * s;
    const bh = h * (spec.minH + rand() * (spec.maxH - spec.minH));
    const top = h - bh;
    ctx.fillStyle = spec.color;
    ctx.fillRect(x, top, bw, bh);

    // Remates de azotea: escalón, depósito o antena.
    const roof = rand();
    if (roof < 0.3) {
      ctx.fillRect(x + bw * 0.2, top - 10 * s, bw * 0.6, 10 * s);
    } else if (roof < 0.5) {
      ctx.fillRect(x + bw * 0.55, top - 14 * s, bw * 0.25, 14 * s);
    } else if (roof < 0.7) {
      ctx.fillRect(x + bw * 0.5 - 1, top - 26 * s, 2, 26 * s);
      ctx.fillRect(x + bw * 0.5 - 6 * s, top - 6 * s, 12 * s, 6 * s);
    }
    ctx.fillStyle = spec.edge;
    ctx.fillRect(x, top, 2, bh);

    const cell = 13 * s;
    const cols = Math.max(2, Math.floor((bw - 12 * s) / cell));
    const rows = Math.floor((bh - 16 * s) / (17 * s));
    const offsetX = (bw - cols * cell + 5 * s) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rand() > spec.windowChance) continue;
        ctx.fillStyle = spec.windows[Math.floor(rand() * spec.windows.length)];
        ctx.fillRect(x + offsetX + c * cell, top + 12 * s + r * 17 * s, 7 * s, 9 * s);
      }
    }
    x += bw + (rand() < 0.25 ? (6 + rand() * 14) * s : 0);
  }
}

/** Ciudad nocturna: luna, nubes tenues y tres filas de edificios iluminados. */
export const cityScene: Scene = {
  twinkles: 26,

  sky(p) {
    const { ctx, w, h, u, rand } = p;
    fillSky(p, [
      [0, '#040A1C'],
      [0.45, '#0A1D47'],
      [0.8, '#1A2F70'],
      [1, '#2A2A78'],
    ]);
    const haze = ctx.createLinearGradient(0, h * 0.5, 0, h);
    haze.addColorStop(0, 'rgba(168, 85, 247, 0)');
    haze.addColorStop(1, 'rgba(168, 85, 247, 0.20)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, h * 0.5, w, h * 0.5);

    scatterStars(p, 130, 0.7);
    ctx.strokeStyle = 'rgba(190, 230, 255, 0.55)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      const x = rand() * w;
      const y = rand() * h * 0.45;
      const s = (3 + rand() * 4) * u;
      ctx.beginPath();
      ctx.moveTo(x - s, y);
      ctx.lineTo(x + s, y);
      ctx.moveTo(x, y - s);
      ctx.lineTo(x, y + s);
      ctx.stroke();
    }

    const mx = w * 0.16;
    const my = h * 0.31;
    const mr = 46 * u;
    glow(ctx, mx, my, mr * 3.2, '140, 190, 255', 0.35);
    const moon = ctx.createRadialGradient(mx - mr * 0.35, my - mr * 0.35, mr * 0.1, mx, my, mr);
    moon.addColorStop(0, '#DCEBFF');
    moon.addColorStop(1, '#7FA6E8');
    disc(ctx, mx, my, mr, moon);
    for (const [dx, dy, r] of [
      [-0.3, -0.2, 0.2],
      [0.3, 0.15, 0.26],
      [-0.1, 0.45, 0.14],
      [0.35, -0.4, 0.12],
    ]) {
      disc(ctx, mx + dx * mr, my + dy * mr, r * mr, 'rgba(70, 110, 190, 0.35)');
    }

    ctx.fillStyle = 'rgba(20, 40, 90, 0.5)';
    for (let i = 0; i < 5; i++) {
      const cx = rand() * w;
      const cy = h * (0.12 + rand() * 0.35);
      const cw = (90 + rand() * 160) * u;
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.ellipse(cx + (k - 1.5) * cw * 0.22, cy + (k % 2) * 6 * u, cw * 0.28, (12 + rand() * 8) * u, 0, 0, TAU);
        ctx.fill();
      }
    }
  },

  layers: [
    {
      drift: 5,
      paint: (p) =>
        skyline(p, {
          minH: 0.34,
          maxH: 0.62,
          minW: 46,
          maxW: 96,
          color: '#0D2150',
          edge: 'rgba(120, 170, 255, 0.10)',
          windows: ['rgba(255, 213, 74, 0.22)', 'rgba(0, 217, 255, 0.16)'],
          windowChance: 0.22,
        }),
    },
    {
      drift: 11,
      paint: (p) =>
        skyline(p, {
          minH: 0.24,
          maxH: 0.47,
          minW: 54,
          maxW: 118,
          color: '#091838',
          edge: 'rgba(120, 170, 255, 0.12)',
          windows: ['rgba(255, 196, 110, 0.55)', 'rgba(255, 213, 74, 0.45)', 'rgba(0, 217, 255, 0.35)'],
          windowChance: 0.3,
        }),
    },
    {
      drift: 20,
      paint: (p) =>
        skyline(p, {
          minH: 0.12,
          maxH: 0.3,
          minW: 70,
          maxW: 150,
          color: '#050E22',
          edge: 'rgba(0, 217, 255, 0.10)',
          windows: ['rgba(255, 196, 110, 0.7)', 'rgba(168, 85, 247, 0.5)', 'rgba(0, 217, 255, 0.5)'],
          windowChance: 0.18,
        }),
    },
  ],
};
