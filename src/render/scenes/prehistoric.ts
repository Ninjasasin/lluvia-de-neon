import { TAU, disc, fillSky, glow, hash, layerX, ridge, scatterStars, type Scene } from './common';

/** Posición del volcán dentro de su capa (fracciones del ancho y el alto). */
const VOLCANO = { x: 0.3, top: 0.4 };

function palm(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, lean: number): void {
  const tx = x + lean * s;
  const ty = y - s;
  ctx.lineCap = 'round';
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * s * 0.2, y - s * 0.6, tx, ty);
  ctx.stroke();
  ctx.lineWidth = s * 0.05;
  for (let i = 0; i < 8; i++) {
    const angle = -Math.PI * 1.1 + (i / 7) * Math.PI * 1.2;
    const length = s * 0.5;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(
      tx + Math.cos(angle) * length * 0.55,
      ty + Math.sin(angle) * length * 0.55 - length * 0.25,
      tx + Math.cos(angle) * length,
      ty + Math.sin(angle) * length + length * 0.4,
    );
    ctx.stroke();
  }
}

/** Hoja de helecho: tallo curvo con folíolos a ambos lados. */
function frond(ctx: CanvasRenderingContext2D, x: number, y: number, length: number, angle: number): void {
  const ex = x + Math.cos(angle) * length;
  const ey = y + Math.sin(angle) * length;
  const cx = (x + ex) / 2;
  const cy = (y + ey) / 2 - length * 0.3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(cx, cy, ex, ey);
  for (let i = 2; i <= 14; i++) {
    const k = i / 14;
    const px = (1 - k) * (1 - k) * x + 2 * (1 - k) * k * cx + k * k * ex;
    const py = (1 - k) * (1 - k) * y + 2 * (1 - k) * k * cy + k * k * ey;
    const tangent = Math.atan2(2 * (1 - k) * (cy - y) + 2 * k * (ey - cy), 2 * (1 - k) * (cx - x) + 2 * k * (ex - cx));
    const leaf = length * 0.17 * (1 - k * 0.7);
    for (const side of [-1, 1]) {
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(tangent + side * 1.05) * leaf, py + Math.sin(tangent + side * 1.05) * leaf);
    }
  }
  ctx.stroke();
}

function sauropod(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.ellipse(x, y - s * 0.42, s * 0.42, s * 0.2, 0, 0, TAU);
  ctx.fill();
  for (const dx of [-0.3, -0.12, 0.1, 0.25]) ctx.fillRect(x + dx * s, y - s * 0.38, s * 0.1, s * 0.38);
  // Cuello y cabeza.
  ctx.beginPath();
  ctx.moveTo(x + s * 0.2, y - s * 0.58);
  ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.7, x + s * 0.66, y - s * 1.16);
  ctx.lineTo(x + s * 0.76, y - s * 1.12);
  ctx.quadraticCurveTo(x + s * 0.64, y - s * 0.6, x + s * 0.38, y - s * 0.34);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + s * 0.78, y - s * 1.15, s * 0.11, s * 0.055, -0.2, 0, TAU);
  ctx.fill();
  // Cola.
  ctx.beginPath();
  ctx.moveTo(x - s * 0.32, y - s * 0.54);
  ctx.quadraticCurveTo(x - s * 0.8, y - s * 0.52, x - s * 1.08, y - s * 0.18);
  ctx.quadraticCurveTo(x - s * 0.75, y - s * 0.36, x - s * 0.36, y - s * 0.28);
  ctx.closePath();
  ctx.fill();
}

function stegosaurus(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.ellipse(x, y - s * 0.3, s * 0.42, s * 0.2, 0, 0, TAU);
  ctx.fill();
  for (const dx of [-0.28, -0.14, 0.12, 0.24]) ctx.fillRect(x + dx * s, y - s * 0.24, s * 0.09, s * 0.24);
  // Placas del lomo.
  for (let i = -3; i <= 3; i++) {
    const px = x + i * s * 0.11;
    const back = y - s * 0.3 - s * 0.2 * Math.sqrt(1 - Math.pow((i * 0.11) / 0.42, 2));
    const height = s * 0.16 * (1 - Math.abs(i) * 0.18);
    ctx.beginPath();
    ctx.moveTo(px - s * 0.055, back + s * 0.03);
    ctx.lineTo(px, back - height);
    ctx.lineTo(px + s * 0.055, back + s * 0.03);
    ctx.closePath();
    ctx.fill();
  }
  // Cabeza baja y cola con púas.
  ctx.beginPath();
  ctx.moveTo(x + s * 0.3, y - s * 0.4);
  ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.3, x + s * 0.62, y - s * 0.16);
  ctx.lineTo(x + s * 0.56, y - s * 0.1);
  ctx.quadraticCurveTo(x + s * 0.44, y - s * 0.16, x + s * 0.3, y - s * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.34, y - s * 0.4);
  ctx.quadraticCurveTo(x - s * 0.66, y - s * 0.36, x - s * 0.9, y - s * 0.2);
  ctx.quadraticCurveTo(x - s * 0.62, y - s * 0.24, x - s * 0.36, y - s * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = s * 0.025;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.8, y - s * 0.26);
  ctx.lineTo(x - s * 0.86, y - s * 0.4);
  ctx.moveTo(x - s * 0.86, y - s * 0.22);
  ctx.lineTo(x - s * 0.96, y - s * 0.34);
  ctx.stroke();
}

function pterodactyl(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, flap: number): void {
  const tipY = y - flap * s * 0.55;
  ctx.fillStyle = '#140A18';
  ctx.beginPath();
  ctx.moveTo(x - s, tipY);
  ctx.quadraticCurveTo(x - s * 0.45, y - s * 0.12 - flap * s * 0.2, x, y - s * 0.06);
  ctx.quadraticCurveTo(x + s * 0.45, y - s * 0.12 - flap * s * 0.2, x + s, tipY);
  ctx.quadraticCurveTo(x + s * 0.45, y + s * 0.16, x + s * 0.1, y + s * 0.14);
  ctx.lineTo(x - s * 0.1, y + s * 0.14);
  ctx.quadraticCurveTo(x - s * 0.45, y + s * 0.16, x - s, tipY);
  ctx.closePath();
  ctx.fill();
  // Cabeza con cresta y pico, mirando hacia la derecha.
  ctx.beginPath();
  ctx.moveTo(x - s * 0.02, y - s * 0.02);
  ctx.lineTo(x - s * 0.22, y - s * 0.26);
  ctx.lineTo(x + s * 0.1, y - s * 0.14);
  ctx.lineTo(x + s * 0.46, y - s * 0.04);
  ctx.lineTo(x + s * 0.1, y + s * 0.03);
  ctx.closePath();
  ctx.fill();
}

/** Prehistoria: volcán activo, selva de helechos, dinosaurios y pterodáctilos al atardecer. */
export const prehistoricScene: Scene = {
  twinkles: 12,

  sky(p) {
    const { ctx, w, h, u } = p;
    fillSky(p, [
      [0, '#0A0B1E'],
      [0.42, '#2B1238'],
      [0.74, '#6E2630'],
      [1, '#A8452A'],
    ]);
    scatterStars(p, 90, 0.4, '#FFD9B0');
    const sx = w * 0.72;
    const sy = h * 0.56;
    glow(ctx, sx, sy, 260 * u, '255, 150, 80', 0.3);
    const sun = ctx.createLinearGradient(0, sy - 80 * u, 0, sy + 80 * u);
    sun.addColorStop(0, '#FFC27A');
    sun.addColorStop(1, '#E0563A');
    disc(ctx, sx, sy, 78 * u, sun);
  },

  layers: [
    {
      drift: 5,
      paint(p) {
        const { ctx, w, h, u, rand } = p;
        const color = '#1C0F24';
        ridge(p, 0.74, 0.03, 1.8, color);

        // Cono del volcán con cráter.
        const cx = w * VOLCANO.x;
        const top = h * VOLCANO.top;
        const baseY = h * 0.78;
        const halfBase = h * 0.44;
        const halfTop = 34 * u;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx - halfBase, baseY);
        ctx.quadraticCurveTo(cx - halfBase * 0.4, top + (baseY - top) * 0.45, cx - halfTop, top);
        ctx.quadraticCurveTo(cx, top + 14 * u, cx + halfTop, top);
        ctx.quadraticCurveTo(cx + halfBase * 0.4, top + (baseY - top) * 0.45, cx + halfBase, baseY);
        ctx.closePath();
        ctx.fill();

        // Humo y resplandor de lava.
        for (let i = 0; i < 26; i++) {
          const k = i / 25;
          glow(
            ctx,
            cx + k * 150 * u + (rand() - 0.5) * 34 * u,
            top - 10 * u - k * 190 * u + (rand() - 0.5) * 16 * u,
            (30 + k * 60) * u,
            '86, 62, 96',
            0.42 - k * 0.26,
          );
        }
        glow(ctx, cx, top + 4 * u, 90 * u, '255, 120, 40', 0.75);
        ctx.lineCap = 'round';
        for (const [dir, length] of [
          [-1, 0.5],
          [1, 0.7],
          [0.2, 0.36],
        ]) {
          const lava = ctx.createLinearGradient(0, top, 0, top + (baseY - top) * length);
          lava.addColorStop(0, 'rgba(255, 210, 110, 0.95)');
          lava.addColorStop(1, 'rgba(255, 90, 30, 0)');
          ctx.strokeStyle = lava;
          ctx.lineWidth = 4 * u;
          ctx.beginPath();
          ctx.moveTo(cx + dir * halfTop * 0.6, top + 6 * u);
          ctx.bezierCurveTo(
            cx + dir * halfTop * 1.3,
            top + (baseY - top) * length * 0.3,
            cx + dir * halfBase * 0.18,
            top + (baseY - top) * length * 0.6,
            cx + dir * halfBase * 0.36 * length * 1.6,
            top + (baseY - top) * length,
          );
          ctx.stroke();
        }
      },
    },
    {
      drift: 11,
      paint(p) {
        const { ctx, w, u, rand } = p;
        const color = '#0C1712';
        const yAt = ridge(p, 0.79, 0.035, 2.1, color);
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        for (let i = 0; i < 9; i++) {
          const x = rand() * w;
          palm(ctx, x, yAt(x) + 4 * u, (70 + rand() * 80) * u, rand() - 0.5);
        }
        ctx.lineCap = 'butt';
        sauropod(ctx, w * 0.62, yAt(w * 0.62) + 6 * u, 150 * u);
        stegosaurus(ctx, w * 0.88, yAt(w * 0.88) + 6 * u, 96 * u);
      },
    },
    {
      drift: 20,
      paint(p) {
        const { ctx, w, h, u, rand } = p;
        const color = '#050A08';
        const yAt = ridge(p, 0.9, 0.018, 1.4, color);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.4 * u;
        ctx.lineCap = 'round';
        for (let i = 0; i < 26; i++) {
          const x = rand() * w;
          const y = yAt(x) + 6 * u;
          const tall = x < w * 0.16;
          const length = (tall ? 90 + rand() * 80 : 36 + rand() * 46) * u;
          frond(ctx, x, y, length, -Math.PI / 2 + (rand() - 0.5) * 1.6);
        }
        ctx.fillStyle = color;
        ctx.fillRect(0, h * 0.95, w, h * 0.05);
      },
    },
  ],

  back(ctx, w, h, t, u) {
    // Brasas que suben desde el cráter.
    const cx = layerX(VOLCANO.x, w);
    const top = h * VOLCANO.top;
    for (let i = 0; i < 16; i++) {
      const life = (t * (0.22 + hash(i, 1) * 0.2) + hash(i, 2)) % 1;
      const x = cx + (hash(i, 3) - 0.5) * 50 * u + life * (hash(i, 4) - 0.3) * 90 * u;
      const y = top - life * 170 * u;
      ctx.globalAlpha = (1 - life) * 0.9;
      disc(ctx, x, y, (1.4 + hash(i, 5) * 1.8) * u, i % 3 === 0 ? '#FFE08A' : '#FF8A3C');
    }
    ctx.globalAlpha = 1;

    const span = w + 260 * u;
    for (let i = 0; i < 3; i++) {
      const speed = (26 + i * 9) * u;
      const x = ((t * speed + hash(i, 6) * span + w * 0.3) % span) - 130 * u;
      const y = h * (0.14 + i * 0.09) + Math.sin(t * 0.6 + i * 2) * 10 * u;
      pterodactyl(ctx, x, y, (30 - i * 6) * u, Math.sin(t * 3.2 + i * 1.7));
    }
  },

  front(ctx, w, h, t, u) {
    // Luciérnagas entre los helechos.
    for (let i = 0; i < 16; i++) {
      const x = hash(i, 7) * w + Math.sin(t * 0.5 + i * 1.3) * 22 * u;
      const y = h * (0.62 + hash(i, 8) * 0.3) + Math.cos(t * 0.4 + i * 2.1) * 14 * u;
      const pulse = 0.35 + 0.65 * Math.max(0, Math.sin(t * 1.6 + i * 2.4));
      glow(ctx, x, y, 9 * u, '210, 255, 130', 0.5 * pulse);
      ctx.globalAlpha = pulse;
      disc(ctx, x, y, 1.5 * u, '#F2FFB0');
      ctx.globalAlpha = 1;
    }
  },
};
