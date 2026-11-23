import { TAU, disc, fillSky, glow, hash, ridge, scatterStars, type Scene } from './common';

function pagoda(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string): void {
  for (let i = 0; i < 5; i++) {
    const tw = s * (0.52 - i * 0.07);
    const floor = y - i * s * 0.2;
    const roof = floor - s * 0.12;
    ctx.fillStyle = color;
    ctx.fillRect(x - tw * 0.32, roof, tw * 0.64, s * 0.12 + 1);
    ctx.beginPath();
    ctx.moveTo(x - tw * 0.64, roof + s * 0.005);
    ctx.quadraticCurveTo(x - tw * 0.32, roof, x - tw * 0.22, roof - s * 0.075);
    ctx.lineTo(x + tw * 0.22, roof - s * 0.075);
    ctx.quadraticCurveTo(x + tw * 0.32, roof, x + tw * 0.64, roof + s * 0.005);
    ctx.lineTo(x + tw * 0.6, roof + s * 0.03);
    ctx.lineTo(x - tw * 0.6, roof + s * 0.03);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 190, 110, 0.85)';
    ctx.fillRect(x - s * 0.02, roof + s * 0.045, s * 0.04, s * 0.05);
  }
  ctx.fillStyle = color;
  ctx.fillRect(x - s * 0.008, y - s * 1.28, s * 0.016, s * 0.24);
  for (let k = 0; k < 3; k++) ctx.fillRect(x - s * 0.03, y - s * (1.12 + k * 0.045), s * 0.06, s * 0.012);
}

function torii(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.fillStyle = '#8C1D26';
  ctx.fillRect(x - s * 0.33, y - s * 0.8, s * 0.07, s * 0.8);
  ctx.fillRect(x + s * 0.26, y - s * 0.8, s * 0.07, s * 0.8);
  ctx.fillRect(x - s * 0.42, y - s * 0.66, s * 0.84, s * 0.06);
  ctx.beginPath();
  ctx.moveTo(x - s * 0.54, y - s * 0.9);
  ctx.quadraticCurveTo(x, y - s * 0.8, x + s * 0.54, y - s * 0.9);
  ctx.lineTo(x + s * 0.5, y - s * 0.78);
  ctx.quadraticCurveTo(x, y - s * 0.72, x - s * 0.5, y - s * 0.78);
  ctx.closePath();
  ctx.fill();
}

/** Pino japonés: tronco torcido con copas aplanadas. */
function bonsaiPine(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x + s * 0.2, y - s * 0.3, x - s * 0.2, y - s * 0.55, x + s * 0.1, y - s * 0.85);
  ctx.stroke();
  for (const [dx, dy, rx] of [
    [0.1, -0.9, 0.32],
    [-0.22, -0.66, 0.26],
    [0.3, -0.56, 0.24],
    [-0.05, -1.04, 0.2],
  ]) {
    ctx.beginPath();
    ctx.ellipse(x + dx * s, y + dy * s, rx * s, rx * s * 0.34, 0, 0, TAU);
    ctx.fill();
  }
}

/** Silueta de samurái de pie, con casco de cuernos, katana al cinto y estandarte a la espalda. */
function samurai(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string): void {
  const poly = (points: number[][]) => {
    ctx.beginPath();
    points.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(x + px * s, y + py * s) : ctx.lineTo(x + px * s, y + py * s)));
    ctx.closePath();
    ctx.fill();
  };
  ctx.lineCap = 'round';

  // Estandarte.
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.018;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.09, y - s * 0.7);
  ctx.lineTo(x - s * 0.13, y - s * 1.42);
  ctx.stroke();
  ctx.fillStyle = '#7A1722';
  poly([
    [-0.13, -1.42],
    [-0.33, -1.4],
    [-0.31, -1.06],
    [-0.115, -1.08],
  ]);

  ctx.fillStyle = color;
  // Hakama y pies.
  poly([
    [-0.13, -0.5],
    [0.13, -0.5],
    [0.21, -0.03],
    [0.04, -0.03],
    [0, -0.3],
    [-0.05, -0.03],
    [-0.23, -0.03],
  ]);
  poly([
    [-0.26, -0.04],
    [-0.04, -0.04],
    [-0.04, 0],
    [-0.28, 0],
  ]);
  poly([
    [0.03, -0.04],
    [0.24, -0.04],
    [0.28, 0],
    [0.03, 0],
  ]);
  // Faldón de la armadura, torso y hombreras.
  poly([
    [-0.17, -0.54],
    [0.17, -0.54],
    [0.22, -0.36],
    [-0.22, -0.36],
  ]);
  poly([
    [-0.14, -0.5],
    [0.14, -0.5],
    [0.17, -0.8],
    [-0.17, -0.8],
  ]);
  poly([
    [-0.16, -0.82],
    [-0.32, -0.76],
    [-0.3, -0.58],
    [-0.16, -0.62],
  ]);
  poly([
    [0.16, -0.82],
    [0.32, -0.76],
    [0.3, -0.58],
    [0.16, -0.62],
  ]);
  // Brazos.
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.24, y - s * 0.64);
  ctx.lineTo(x - s * 0.25, y - s * 0.44);
  ctx.moveTo(x + s * 0.24, y - s * 0.64);
  ctx.lineTo(x + s * 0.15, y - s * 0.5);
  ctx.stroke();
  // Cabeza y casco con protector de nuca.
  disc(ctx, x, y - s * 0.88, s * 0.068, color);
  poly([
    [-0.085, -0.93],
    [0.085, -0.93],
    [0.15, -0.8],
    [-0.15, -0.8],
  ]);
  ctx.beginPath();
  ctx.arc(x, y - s * 0.92, s * 0.085, Math.PI, TAU);
  ctx.fill();
  // Cuernos del casco.
  ctx.lineWidth = s * 0.026;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.03, y - s * 0.98);
  ctx.quadraticCurveTo(x - s * 0.13, y - s * 1.0, x - s * 0.15, y - s * 1.14);
  ctx.moveTo(x + s * 0.03, y - s * 0.98);
  ctx.quadraticCurveTo(x + s * 0.13, y - s * 1.0, x + s * 0.15, y - s * 1.14);
  ctx.stroke();
  // Katana al cinto.
  ctx.lineWidth = s * 0.024;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.26, y - s * 0.6);
  ctx.quadraticCurveTo(x - s * 0.1, y - s * 0.5, x - s * 0.46, y - s * 0.3);
  ctx.stroke();
}

/** Japón feudal: sol rojo tras el monte nevado, pagoda, torii, samurái y pétalos de cerezo. */
export const japanScene: Scene = {
  twinkles: 10,

  sky(p) {
    const { ctx, w, h, u, rand } = p;
    fillSky(p, [
      [0, '#0B0A22'],
      [0.4, '#231240'],
      [0.68, '#5A1F4A'],
      [0.88, '#8E3340'],
      [1, '#B85A3E'],
    ]);
    scatterStars(p, 70, 0.35, '#FFD9E6');
    const sx = w * 0.62;
    const sy = h * 0.5;
    const sr = 125 * u;
    glow(ctx, sx, sy, sr * 2.4, '255, 90, 70', 0.3);
    const sun = ctx.createLinearGradient(0, sy - sr, 0, sy + sr);
    sun.addColorStop(0, '#FF7652');
    sun.addColorStop(1, '#BE2A3A');
    disc(ctx, sx, sy, sr, sun);
    // Bandas de nubes que cruzan el sol.
    for (let i = 0; i < 6; i++) {
      const y = sy - sr * 0.7 + i * sr * 0.3 + rand() * 10 * u;
      ctx.fillStyle = `rgba(30, 14, 52, ${0.3 + rand() * 0.25})`;
      ctx.beginPath();
      ctx.ellipse(sx + (rand() - 0.5) * sr * 1.6, y, (90 + rand() * 150) * u, (4 + rand() * 5) * u, 0, 0, TAU);
      ctx.fill();
    }
  },

  layers: [
    {
      drift: 4,
      paint(p) {
        const { ctx, w, h, u, rand } = p;
        const color = '#1B1638';
        ridge(p, 0.72, 0.035, 1.9, color);
        // Monte nevado de laderas cóncavas.
        const cx = w * 0.62;
        const top = h * 0.3;
        const baseY = h * 0.76;
        const half = h * 0.62;
        const crater = 26 * u;
        const side = (dir: number, k: number): [number, number] => [
          cx + dir * (crater + (half - crater) * Math.pow(k, 1.9)),
          top + (baseY - top) * k,
        ];
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let k = 1; k >= 0; k -= 0.05) ctx.lineTo(...side(-1, Math.max(0, k)));
        for (let k = 0; k <= 1.001; k += 0.05) ctx.lineTo(...side(1, Math.min(1, k)));
        ctx.closePath();
        ctx.fill();
        // Nieve en la cima, con borde irregular.
        ctx.fillStyle = 'rgba(236, 230, 246, 0.92)';
        const snow = 0.3;
        ctx.beginPath();
        for (let k = snow; k >= 0; k -= 0.03) ctx.lineTo(...side(-1, Math.max(0, k)));
        for (let k = 0; k <= snow + 0.001; k += 0.03) ctx.lineTo(...side(1, Math.min(snow, k)));
        const [rx, ry] = side(1, snow);
        const [lx] = side(-1, snow);
        const teeth = 11;
        for (let i = 1; i < teeth; i++) {
          const x = rx + ((lx - rx) * i) / teeth;
          ctx.lineTo(x, ry - (i % 2 === 0 ? 0 : (0.03 + rand() * 0.04) * h));
        }
        ctx.closePath();
        ctx.fill();
        // Bruma al pie.
        const mist = ctx.createLinearGradient(0, h * 0.62, 0, h * 0.8);
        mist.addColorStop(0, 'rgba(255, 200, 210, 0)');
        mist.addColorStop(0.6, 'rgba(255, 200, 210, 0.16)');
        mist.addColorStop(1, 'rgba(255, 200, 210, 0)');
        ctx.fillStyle = mist;
        ctx.fillRect(0, h * 0.62, w, h * 0.18);
      },
    },
    {
      drift: 10,
      paint(p) {
        const { ctx, w, u, rand } = p;
        const color = '#120E26';
        const yAt = ridge(p, 0.8, 0.04, 1.7, color);
        pagoda(ctx, w * 0.1, yAt(w * 0.1) + 6 * u, 170 * u, color);
        torii(ctx, w * 0.87, yAt(w * 0.87) + 6 * u, 92 * u);
        for (let i = 0; i < 9; i++) {
          const x = w * (0.3 + rand() * 0.5);
          bonsaiPine(ctx, x, yAt(x) + 4 * u, (44 + rand() * 40) * u, color);
        }
      },
    },
    {
      drift: 20,
      paint(p) {
        const { ctx, w, h, u, rand } = p;
        const color = '#07060F';
        // Risco en primer plano y suelo.
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(0, h * 0.8);
        ctx.quadraticCurveTo(w * 0.14, h * 0.74, w * 0.33, h * 0.76);
        ctx.lineTo(w * 0.37, h * 0.8);
        ctx.quadraticCurveTo(w * 0.39, h * 0.9, w * 0.49, h * 0.93);
        ctx.lineTo(w, h * 0.95);
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
        samurai(ctx, w * 0.28, h * 0.757, 120 * u, color);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 * u;
        ctx.lineCap = 'round';
        for (let i = 0; i < 60; i++) {
          const x = rand() * w;
          const y = x < w * 0.34 ? h * 0.775 : h * 0.945;
          ctx.beginPath();
          ctx.moveTo(x, y + 4 * u);
          ctx.lineTo(x + (rand() - 0.5) * 10 * u, y - (6 + rand() * 12) * u);
          ctx.stroke();
        }

        // Rama de cerezo en la esquina superior izquierda.
        ctx.strokeStyle = '#150B14';
        const blossoms: [number, number][] = [];
        const branch = (x0: number, y0: number, x1: number, y1: number, width: number) => {
          ctx.lineWidth = width * u;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.quadraticCurveTo((x0 + x1) / 2, y0 + (y1 - y0) * 0.2, x1, y1);
          ctx.stroke();
          for (let k = 0.3; k <= 1; k += 0.14) blossoms.push([x0 + (x1 - x0) * k, y0 + (y1 - y0) * k * k]);
        };
        branch(0, h * 0.03, w * 0.26, h * 0.13, 6);
        branch(w * 0.08, h * 0.05, w * 0.17, h * 0.22, 3.5);
        branch(w * 0.15, h * 0.08, w * 0.3, h * 0.05, 3);
        branch(0, h * 0.12, w * 0.08, h * 0.2, 3);
        for (const [bx, by] of blossoms) {
          for (let k = 0; k < 5; k++) {
            disc(
              ctx,
              bx + (rand() - 0.5) * 26 * u,
              by + (rand() - 0.5) * 20 * u,
              (4 + rand() * 5) * u,
              rand() < 0.3 ? 'rgba(255, 220, 232, 0.9)' : 'rgba(255, 160, 195, 0.85)',
            );
          }
        }
      },
    },
  ],

  front(ctx, w, h, t, u) {
    // Pétalos de cerezo llevados por el viento.
    ctx.fillStyle = 'rgba(255, 186, 212, 0.85)';
    for (let i = 0; i < 30; i++) {
      const x =
        ((hash(i, 1) * w + t * (18 + hash(i, 2) * 20) * u + Math.sin(t * 0.8 + i) * 20 * u) % (w + 40)) - 20;
      const y = ((hash(i, 3) * h + t * (26 + hash(i, 4) * 22) * u) % (h + 20)) - 10;
      ctx.beginPath();
      ctx.ellipse(x, y, 4.6 * u, 2.6 * u, t * (0.8 + hash(i, 5)) + i, 0, TAU);
      ctx.fill();
    }
  },
};
