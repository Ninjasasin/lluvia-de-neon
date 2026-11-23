import { TAU, disc, fillSky, glow, hash, ridge, scatterStars, type Scene } from './common';

function ufo(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, seed: number): void {
  glow(ctx, x, y + s * 0.3, s * 1.8, '120, 255, 170', 0.18);
  ctx.fillStyle = 'rgba(140, 240, 255, 0.78)';
  ctx.beginPath();
  ctx.ellipse(x, y - s * 0.1, s * 0.42, s * 0.42, 0, Math.PI, TAU);
  ctx.fill();
  const hull = ctx.createLinearGradient(0, y - s * 0.26, 0, y + s * 0.26);
  hull.addColorStop(0, '#D3DEF6');
  hull.addColorStop(1, '#46526F');
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.ellipse(x, y, s, s * 0.26, 0, 0, TAU);
  ctx.fill();
  for (let k = 0; k < 5; k++) {
    const lit = Math.floor(t * 4 + k + seed) % 3 === 0;
    disc(ctx, x + (k - 2) * s * 0.36, y + s * 0.07, s * 0.07, lit ? '#FFE27A' : '#7A5C2E');
  }
}

function alien(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, waving: boolean): void {
  ctx.strokeStyle = '#2E9E78';
  ctx.lineCap = 'round';
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.07, y - s * 0.1);
  ctx.lineTo(x - s * 0.1, y);
  ctx.moveTo(x + s * 0.07, y - s * 0.1);
  ctx.lineTo(x + s * 0.1, y);
  ctx.moveTo(x - s * 0.13, y - s * 0.4);
  ctx.lineTo(x - s * 0.3, y - s * 0.2);
  ctx.moveTo(x + s * 0.13, y - s * 0.4);
  ctx.lineTo(x + s * 0.32, waving ? y - s * 0.68 : y - s * 0.2);
  ctx.stroke();

  ctx.fillStyle = '#2E9E78';
  ctx.beginPath();
  ctx.ellipse(x, y - s * 0.28, s * 0.16, s * 0.26, 0, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = '#3FBF8F';
  ctx.lineWidth = s * 0.04;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.08, y - s * 0.9);
  ctx.lineTo(x - s * 0.16, y - s * 1.1);
  ctx.moveTo(x + s * 0.08, y - s * 0.9);
  ctx.lineTo(x + s * 0.16, y - s * 1.1);
  ctx.stroke();
  disc(ctx, x - s * 0.16, y - s * 1.1, s * 0.05, '#9CFFD0');
  disc(ctx, x + s * 0.16, y - s * 1.1, s * 0.05, '#9CFFD0');

  ctx.fillStyle = '#3FBF8F';
  ctx.beginPath();
  ctx.ellipse(x, y - s * 0.72, s * 0.27, s * 0.23, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#06121A';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + side * s * 0.11, y - s * 0.72, s * 0.07, s * 0.115, side * 0.5, 0, TAU);
    ctx.fill();
  }
  disc(ctx, x - s * 0.13, y - s * 0.77, s * 0.02, '#FFFFFF');
  disc(ctx, x + s * 0.09, y - s * 0.77, s * 0.02, '#FFFFFF');
}

/** Espacio: nebulosas, planeta con anillos, base alienígena y platillos que cruzan el cielo. */
export const spaceScene: Scene = {
  twinkles: 40,

  sky(p) {
    const { ctx, w, h, u } = p;
    fillSky(p, [
      [0, '#03020C'],
      [0.4, '#0B0726'],
      [0.75, '#1A0F3F'],
      [1, '#2A1352'],
    ]);
    glow(ctx, w * 0.7, h * 0.25, h * 0.5, '168, 85, 247', 0.24);
    glow(ctx, w * 0.32, h * 0.52, h * 0.42, '0, 217, 255', 0.12);
    glow(ctx, w * 0.86, h * 0.62, h * 0.32, '255, 80, 160', 0.13);
    glow(ctx, w * 0.1, h * 0.15, h * 0.3, '90, 120, 255', 0.14);
    scatterStars(p, 240, 0.85, '#D9C8FF');

    // Planeta con anillos: mitad trasera del anillo, disco y mitad delantera.
    const px = w * 0.2;
    const py = h * 0.27;
    const pr = 62 * u;
    const ring = (from: number, to: number) => {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-0.35);
      ctx.lineWidth = 9 * u;
      ctx.strokeStyle = 'rgba(255, 214, 170, 0.55)';
      ctx.beginPath();
      ctx.ellipse(0, 0, pr * 1.75, pr * 0.42, 0, from, to);
      ctx.stroke();
      ctx.lineWidth = 3 * u;
      ctx.strokeStyle = 'rgba(255, 240, 220, 0.6)';
      ctx.beginPath();
      ctx.ellipse(0, 0, pr * 1.48, pr * 0.34, 0, from, to);
      ctx.stroke();
      ctx.restore();
    };
    glow(ctx, px, py, pr * 2.6, '255, 150, 120', 0.2);
    ring(Math.PI, TAU);
    const body = ctx.createRadialGradient(px - pr * 0.4, py - pr * 0.4, pr * 0.1, px, py, pr);
    body.addColorStop(0, '#FFC58A');
    body.addColorStop(0.55, '#C2477A');
    body.addColorStop(1, '#4A1858');
    disc(ctx, px, py, pr, body);
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, TAU);
    ctx.clip();
    ctx.fillStyle = 'rgba(255, 230, 200, 0.14)';
    for (const band of [-0.55, -0.15, 0.3, 0.62]) ctx.fillRect(px - pr, py + band * pr, pr * 2, pr * 0.14);
    ctx.restore();
    ring(0, Math.PI);

    // Luna pequeña con su sombra.
    const mx = w * 0.83;
    const my = h * 0.17;
    disc(ctx, mx, my, 17 * u, '#AEB9DA');
    disc(ctx, mx + 6 * u, my - 3 * u, 15 * u, 'rgba(11, 7, 38, 0.6)');
  },

  layers: [
    {
      drift: 6,
      paint(p) {
        const { ctx, w, h, u, rand } = p;
        const color = '#170C36';
        const yAt = ridge(p, 0.76, 0.03, 2.2, color);
        for (let i = 0; i < 11; i++) {
          const x = rand() * w;
          const base = yAt(x) + 6;
          const height = h * (0.08 + rand() * 0.2);
          const half = (10 + rand() * 16) * u;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(x - half, base);
          ctx.quadraticCurveTo(x - half * 0.3, base - height * 0.5, x, base - height);
          ctx.quadraticCurveTo(x + half * 0.4, base - height * 0.45, x + half, base);
          ctx.closePath();
          ctx.fill();
          glow(ctx, x, base - height, 12 * u, '0, 217, 255', 0.55);
          disc(ctx, x, base - height, 1.8 * u, '#BFF6FF');
        }
      },
    },
    {
      drift: 14,
      paint(p) {
        const { ctx, w, h, u, rand } = p;
        const ground = ctx.createLinearGradient(0, h * 0.82, 0, h);
        ground.addColorStop(0, '#1F1642');
        ground.addColorStop(1, '#07051A');
        const yAt = ridge(p, 0.86, 0.016, 1.6, ground);

        for (let i = 0; i < 10; i++) {
          const cx = rand() * w;
          const cy = yAt(cx) + h * (0.03 + rand() * 0.1);
          const rx = (14 + rand() * 30) * u;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, rx * 0.28, 0, 0, TAU);
          ctx.fill();
          ctx.strokeStyle = 'rgba(160, 140, 230, 0.28)';
          ctx.lineWidth = 1.5 * u;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, rx * 0.28, 0, 0, Math.PI);
          ctx.stroke();
        }

        // Base alienígena: cúpulas con ventanas y una antena.
        const bx = w * 0.7;
        for (const [dx, r] of [
          [-58, 26],
          [0, 38],
          [52, 20],
        ]) {
          const x = bx + dx * u;
          const y = yAt(x) + 4 * u;
          ctx.fillStyle = '#2A2550';
          ctx.beginPath();
          ctx.arc(x, y, r * u, Math.PI, TAU);
          ctx.fill();
          ctx.strokeStyle = 'rgba(120, 255, 170, 0.55)';
          ctx.lineWidth = 1.5 * u;
          ctx.stroke();
          ctx.fillStyle = 'rgba(120, 255, 170, 0.85)';
          for (let k = -1; k <= 1; k++) ctx.fillRect(x + k * r * u * 0.42 - 2.5 * u, y - r * u * 0.45, 5 * u, 6 * u);
        }
        const ax = bx + 86 * u;
        const ay = yAt(ax);
        ctx.strokeStyle = '#3A3566';
        ctx.lineWidth = 2 * u;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax, ay - 52 * u);
        ctx.stroke();
        glow(ctx, ax, ay - 52 * u, 10 * u, '255, 80, 100', 0.7);
        disc(ctx, ax, ay - 52 * u, 2.4 * u, '#FF7088');

        alien(ctx, w * 0.3, yAt(w * 0.3) + 3 * u, 34 * u, true);
        alien(ctx, w * 0.355, yAt(w * 0.355) + 3 * u, 26 * u, false);
      },
    },
  ],

  back(ctx, w, h, t, u) {
    // Estrella fugaz cada pocos segundos.
    const cycle = t % 9;
    if (t > 0 && cycle < 0.7) {
      const k = cycle / 0.7;
      const x = w * (0.2 + hash(Math.floor(t / 9)) * 0.5) + k * 220 * u;
      const y = h * 0.07 + k * 120 * u;
      const trail = ctx.createLinearGradient(x - 80 * u, y - 44 * u, x, y);
      trail.addColorStop(0, 'rgba(255, 255, 255, 0)');
      trail.addColorStop(1, `rgba(255, 255, 255, ${Math.sin(k * Math.PI)})`);
      ctx.strokeStyle = trail;
      ctx.lineWidth = 2 * u;
      ctx.beginPath();
      ctx.moveTo(x - 80 * u, y - 44 * u);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    const span = w + 300 * u;
    const x1 = ((t * 38 * u + w * 0.62 + 150 * u) % span) - 150 * u;
    const y1 = h * 0.3 + Math.sin(t * 0.9) * 10 * u;
    const beam = Math.sin(t * 0.4 + 1.2);
    if (beam > 0.55) {
      const alpha = ((beam - 0.55) / 0.45) * 0.2;
      const light = ctx.createLinearGradient(0, y1, 0, h * 0.82);
      light.addColorStop(0, `rgba(120, 255, 170, ${alpha})`);
      light.addColorStop(1, 'rgba(120, 255, 170, 0)');
      ctx.fillStyle = light;
      ctx.beginPath();
      ctx.moveTo(x1 - 12 * u, y1);
      ctx.lineTo(x1 + 12 * u, y1);
      ctx.lineTo(x1 + 70 * u, h * 0.82);
      ctx.lineTo(x1 - 70 * u, h * 0.82);
      ctx.closePath();
      ctx.fill();
    }
    ufo(ctx, x1, y1, 34 * u, t, 0);

    const x2 = w + 150 * u - ((t * 22 * u + w * 0.55) % span);
    ufo(ctx, x2, h * 0.15 + Math.sin(t * 0.7 + 2) * 6 * u, 18 * u, t, 1);
  },
};
