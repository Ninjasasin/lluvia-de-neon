import { TAU, disc, fillSky, glow, hash, ridge, type Scene } from './common';

function coral(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  depth: number,
  u: number,
  rand: () => number,
): void {
  const ex = x + Math.cos(angle) * length;
  const ey = y + Math.sin(angle) * length;
  ctx.lineWidth = (1.5 + depth * 1.6) * u;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  if (depth <= 0) return;
  const branches = rand() < 0.4 ? 3 : 2;
  for (let i = 0; i < branches; i++) {
    const spread = (i - (branches - 1) / 2) * (0.5 + rand() * 0.3);
    coral(ctx, ex, ey, angle + spread, length * (0.66 + rand() * 0.12), depth - 1, u, rand);
  }
}

function fish(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, dir: number): void {
  ctx.beginPath();
  ctx.ellipse(x, y, s, s * 0.42, 0, 0, TAU);
  ctx.moveTo(x - dir * s * 0.8, y);
  ctx.lineTo(x - dir * s * 1.6, y - s * 0.5);
  ctx.lineTo(x - dir * s * 1.6, y + s * 0.5);
  ctx.closePath();
  ctx.fill();
}

function whale(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.ellipse(x, y, s, s * 0.26, 0, 0, TAU);
  ctx.fill();
  // Cola con aletas.
  ctx.beginPath();
  ctx.moveTo(x - s * 0.8, y - s * 0.12);
  ctx.quadraticCurveTo(x - s * 1.3, y - s * 0.04, x - s * 1.5, y - s * 0.02);
  ctx.lineTo(x - s * 1.78, y - s * 0.26);
  ctx.quadraticCurveTo(x - s * 1.62, y, x - s * 1.78, y + s * 0.26);
  ctx.lineTo(x - s * 1.5, y + s * 0.04);
  ctx.quadraticCurveTo(x - s * 1.3, y + s * 0.08, x - s * 0.8, y + s * 0.14);
  ctx.closePath();
  ctx.fill();
  // Aleta pectoral.
  ctx.beginPath();
  ctx.moveTo(x + s * 0.3, y + s * 0.16);
  ctx.quadraticCurveTo(x + s * 0.1, y + s * 0.5, x - s * 0.16, y + s * 0.52);
  ctx.quadraticCurveTo(x + s * 0.02, y + s * 0.3, x + s * 0.06, y + s * 0.2);
  ctx.closePath();
  ctx.fill();
}

/** Fondo del mar: rayos de luz, ruinas hundidas, arrecife de coral, peces, medusas y burbujas. */
export const oceanScene: Scene = {
  twinkles: 0,

  sky(p) {
    const { ctx, w, h, rand } = p;
    fillSky(p, [
      [0, '#0A6A8C'],
      [0.3, '#07486E'],
      [0.65, '#052A4E'],
      [1, '#03142B'],
    ]);
    // Rayos de luz que bajan desde la superficie.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const x = w * (0.05 + i * 0.15 + rand() * 0.05);
      const width = w * (0.03 + rand() * 0.05);
      const reach = h * (0.5 + rand() * 0.35);
      const shaft = ctx.createLinearGradient(0, 0, 0, reach);
      shaft.addColorStop(0, 'rgba(170, 240, 255, 0.16)');
      shaft.addColorStop(1, 'rgba(170, 240, 255, 0)');
      ctx.fillStyle = shaft;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + width, 0);
      ctx.lineTo(x + width * 2.2 - w * 0.08, reach);
      ctx.lineTo(x - width * 1.2 - w * 0.08, reach);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // Partículas en suspensión.
    ctx.fillStyle = '#CFF6FF';
    for (let i = 0; i < 110; i++) {
      ctx.globalAlpha = 0.08 + rand() * 0.22;
      ctx.beginPath();
      ctx.arc(rand() * w, rand() * h, 0.5 + rand() * 1.3, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  layers: [
    {
      drift: 5,
      paint(p) {
        const { ctx, w, u, rand } = p;
        const color = '#06304F';
        const yAt = ridge(p, 0.74, 0.07, 2.4, color, 0.012);
        // Ruinas hundidas: columnas, algunas rotas, y un dintel.
        const start = w * 0.6;
        ctx.fillStyle = '#083A5E';
        const heights = [150, 150, 84, 150, 46];
        heights.forEach((height, i) => {
          const x = start + i * 44 * u;
          const y = yAt(x) + 8 * u;
          ctx.fillRect(x - 9 * u, y - height * u, 18 * u, height * u);
          ctx.fillRect(x - 13 * u, y - 6 * u, 26 * u, 6 * u);
          if (height === 150) ctx.fillRect(x - 13 * u, y - height * u - 7 * u, 26 * u, 7 * u);
        });
        ctx.fillRect(start - 16 * u, yAt(start) - 150 * u - 5 * u, 76 * u, 12 * u);
        for (let i = 0; i < 5; i++) {
          const x = w * rand() * 0.5;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.ellipse(x, yAt(x) + 4 * u, (24 + rand() * 40) * u, (30 + rand() * 60) * u, 0, Math.PI, TAU);
          ctx.fill();
        }
      },
    },
    {
      drift: 11,
      paint(p) {
        const { ctx, w, u, rand } = p;
        const yAt = ridge(p, 0.84, 0.035, 2, '#04213A');
        const tints = ['rgba(214, 86, 140, 0.8)', 'rgba(230, 130, 70, 0.8)', 'rgba(140, 100, 230, 0.8)', 'rgba(60, 200, 190, 0.7)'];
        ctx.lineCap = 'round';
        for (let i = 0; i < 12; i++) {
          const x = rand() * w;
          const y = yAt(x) + 6 * u;
          ctx.strokeStyle = tints[Math.floor(rand() * tints.length)];
          coral(ctx, x, y, -Math.PI / 2 + (rand() - 0.5) * 0.4, (20 + rand() * 20) * u, 3, u, rand);
        }
        // Corales redondeados.
        for (let i = 0; i < 9; i++) {
          const x = rand() * w;
          const r = (10 + rand() * 18) * u;
          ctx.fillStyle = tints[Math.floor(rand() * tints.length)];
          ctx.beginPath();
          ctx.arc(x, yAt(x) + 5 * u, r, Math.PI, TAU);
          ctx.fill();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
          ctx.beginPath();
          ctx.arc(x - r * 0.3, yAt(x) - r * 0.35, r * 0.28, 0, TAU);
          ctx.fill();
        }
      },
    },
    {
      drift: 20,
      paint(p) {
        const { ctx, w, h, u, rand } = p;
        const sand = ctx.createLinearGradient(0, h * 0.88, 0, h);
        sand.addColorStop(0, '#0C3144');
        sand.addColorStop(1, '#051722');
        const yAt = ridge(p, 0.925, 0.012, 1.3, sand);
        for (let i = 0; i < 12; i++) {
          const x = rand() * w;
          ctx.fillStyle = '#041420';
          ctx.beginPath();
          ctx.ellipse(x, yAt(x) + 6 * u, (10 + rand() * 26) * u, (6 + rand() * 14) * u, 0, Math.PI, TAU);
          ctx.fill();
        }
        // Estrellas de mar.
        for (let i = 0; i < 4; i++) {
          const x = w * (0.12 + i * 0.24 + rand() * 0.08);
          const y = yAt(x) + 16 * u;
          const r = (7 + rand() * 4) * u;
          const turn = rand() * TAU;
          ctx.fillStyle = 'rgba(240, 130, 80, 0.85)';
          ctx.beginPath();
          for (let k = 0; k < 10; k++) {
            const radius = k % 2 === 0 ? r : r * 0.42;
            const a = turn + (k / 10) * TAU;
            ctx.lineTo(x + Math.cos(a) * radius, y + Math.sin(a) * radius * 0.7);
          }
          ctx.closePath();
          ctx.fill();
        }
      },
    },
  ],

  back(ctx, w, h, t, u) {
    // Ballena lejana.
    const whaleSpan = w + 720 * u;
    ctx.fillStyle = '#06344F';
    whale(ctx, ((t * 9 * u + w * 0.78 + 300 * u) % whaleSpan) - 300 * u, h * 0.23 + Math.sin(t * 0.25) * 10 * u, 130 * u);

    // Dos bancos de peces en sentidos opuestos.
    const span = w + 520 * u;
    const school1 = w + 240 * u - ((t * 40 * u + w * 0.45) % span);
    ctx.fillStyle = 'rgba(150, 225, 255, 0.6)';
    for (let i = 0; i < 13; i++) {
      fish(
        ctx,
        school1 + hash(i, 1) * 170 * u,
        h * 0.42 + (hash(i, 2) - 0.5) * 80 * u + Math.sin(t * 2 + i) * 4 * u,
        (6 + hash(i, 3) * 4) * u,
        -1,
      );
    }
    const school2 = ((t * 30 * u + w * 0.3 + 240 * u) % span) - 240 * u;
    ctx.fillStyle = 'rgba(255, 170, 90, 0.65)';
    for (let i = 0; i < 9; i++) {
      fish(
        ctx,
        school2 - hash(i, 4) * 130 * u,
        h * 0.6 + (hash(i, 5) - 0.5) * 60 * u + Math.sin(t * 2.4 + i) * 3 * u,
        (4.5 + hash(i, 6) * 3) * u,
        1,
      );
    }

    // Medusas luminosas.
    for (let i = 0; i < 3; i++) {
      const x = w * (0.14 + i * 0.3) + Math.sin(t * 0.2 + i * 2) * 30 * u;
      const y = h * (0.3 + i * 0.11) + Math.sin(t * 0.5 + i * 2.2) * 18 * u;
      const s = (16 + i * 4) * u;
      const pulse = 1 + 0.12 * Math.sin(t * 2 + i);
      glow(ctx, x, y, s * 2.6, '210, 150, 255', 0.22);
      ctx.strokeStyle = 'rgba(225, 180, 255, 0.5)';
      ctx.lineWidth = 1.4 * u;
      ctx.beginPath();
      for (let k = -2; k <= 2; k++) {
        const tx = x + k * s * 0.34 * pulse;
        ctx.moveTo(tx, y);
        for (let seg = 1; seg <= 5; seg++) {
          ctx.lineTo(tx + Math.sin(t * 2 + seg * 0.9 + k + i) * 3.5 * u, y + seg * s * 0.44);
        }
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(215, 160, 255, 0.6)';
      ctx.beginPath();
      ctx.ellipse(x, y, s * pulse, (s * 0.78) / pulse, 0, Math.PI, TAU);
      ctx.fill();
    }
  },

  front(ctx, w, h, t, u) {
    // Algas que se mecen.
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4.5 * u;
    for (let i = 0; i < 14; i++) {
      const x = hash(i, 7) * w;
      const y = h * (0.94 + hash(i, 8) * 0.05);
      const length = h * (0.09 + hash(i, 9) * 0.14);
      ctx.strokeStyle = i % 2 === 0 ? '#0B5A4A' : '#0E7A5C';
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let seg = 1; seg <= 6; seg++) {
        ctx.lineTo(x + Math.sin(t * 0.9 + i + seg * 0.6) * seg * 3.2 * u, y - (seg / 6) * length);
      }
      ctx.stroke();
    }
    // Burbujas.
    ctx.lineWidth = 1.2 * u;
    for (let i = 0; i < 24; i++) {
      const rise = (t * (22 + hash(i, 10) * 26) * u + hash(i, 11) * (h + 40)) % (h + 40);
      const x = hash(i, 12) * w + Math.sin(t * 1.2 + i * 1.9) * 8 * u;
      const y = h + 20 - rise;
      const r = (2 + hash(i, 13) * 4.5) * u;
      ctx.strokeStyle = 'rgba(205, 245, 255, 0.55)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.stroke();
      disc(ctx, x - r * 0.35, y - r * 0.35, r * 0.22, 'rgba(255, 255, 255, 0.7)');
    }
  },
};
