import { TAU, disc, fillSky, glow, hash, pine, ridge, scatterStars, type Scene } from './common';

/** Cortinas de la aurora: `base` es la altura de su borde inferior y `height` cuánto suben los rayos. */
const BANDS = [
  { base: 0.4, height: 0.34, low: '70, 255, 160', high: '150, 110, 255', phase: 0, waves: 1.2, alpha: 0.5 },
  { base: 0.3, height: 0.26, low: '90, 230, 255', high: '110, 120, 255', phase: 2.3, waves: 0.8, alpha: 0.32 },
  { base: 0.5, height: 0.3, low: '120, 255, 140', high: '255, 110, 200', phase: 4.4, waves: 1.6, alpha: 0.3 },
] as const;

/** Aurora polar: cortinas de luz sobre montañas nevadas, bosque de abetos y una cabaña. */
export const auroraScene: Scene = {
  twinkles: 34,

  sky(p) {
    fillSky(p, [
      [0, '#030817'],
      [0.5, '#06142E'],
      [0.85, '#0B2A45'],
      [1, '#12384F'],
    ]);
    scatterStars(p, 230, 0.75);
  },

  layers: [
    {
      drift: 5,
      paint(p) {
        const { ctx, h } = p;
        const snow = ctx.createLinearGradient(0, h * 0.44, 0, h * 0.74);
        snow.addColorStop(0, '#B9D2EE');
        snow.addColorStop(0.35, '#3D5F8E');
        snow.addColorStop(1, '#0E2240');
        ridge(p, 0.64, 0.12, 2.6, snow, 0.03);
      },
    },
    {
      drift: 11,
      paint(p) {
        const { ctx, w, u, rand } = p;
        const color = '#07162A';
        const yAt = ridge(p, 0.81, 0.03, 1.8, color);
        for (let i = 0; i < 70; i++) {
          const x = rand() * w;
          pine(ctx, x, yAt(x) + 6 * u, (34 + rand() * 60) * u, color);
        }
      },
    },
    {
      drift: 20,
      paint(p) {
        const { ctx, w, h, u, rand } = p;
        const ground = ctx.createLinearGradient(0, h * 0.86, 0, h);
        ground.addColorStop(0, '#1C4465');
        ground.addColorStop(1, '#0A1C30');
        const yAt = ridge(p, 0.905, 0.012, 1.2, ground);

        // Cabaña con tejado nevado, ventana encendida y humo.
        const cx = w * 0.76;
        const cy = yAt(cx) + 6 * u;
        const cw = 74 * u;
        const ch = 40 * u;
        for (let i = 0; i < 6; i++) {
          disc(ctx, cx + cw * 0.22 + i * 7 * u, cy - ch - 40 * u - i * 15 * u, (6 + i * 2.6) * u, `rgba(190, 210, 235, ${0.3 - i * 0.04})`);
        }
        ctx.fillStyle = '#0A1626';
        ctx.fillRect(cx - cw / 2, cy - ch, cw, ch);
        ctx.fillRect(cx + cw * 0.16, cy - ch - 32 * u, 11 * u, 22 * u);
        ctx.beginPath();
        ctx.moveTo(cx - cw * 0.62, cy - ch + 2 * u);
        ctx.lineTo(cx, cy - ch - 30 * u);
        ctx.lineTo(cx + cw * 0.62, cy - ch + 2 * u);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#DCEBFA';
        ctx.lineWidth = 5 * u;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - cw * 0.6, cy - ch);
        ctx.lineTo(cx, cy - ch - 30 * u);
        ctx.lineTo(cx + cw * 0.6, cy - ch);
        ctx.stroke();
        glow(ctx, cx - cw * 0.16, cy - ch * 0.5, 46 * u, '255, 190, 110', 0.45);
        ctx.fillStyle = '#FFD08A';
        ctx.fillRect(cx - cw * 0.3, cy - ch * 0.72, cw * 0.28, ch * 0.44);
        ctx.fillStyle = '#0A1626';
        ctx.fillRect(cx - cw * 0.165, cy - ch * 0.72, 2 * u, ch * 0.44);
        ctx.fillRect(cx + cw * 0.14, cy - ch * 0.62, cw * 0.2, ch * 0.62);

        // Abetos nevados en primer plano.
        for (let i = 0; i < 9; i++) {
          const x = rand() * w;
          if (Math.abs(x - cx) < cw) continue;
          const height = (70 + rand() * 80) * u;
          const y = yAt(x) + 8 * u;
          pine(ctx, x, y, height, '#050F1D');
          ctx.fillStyle = 'rgba(220, 235, 250, 0.75)';
          for (let k = 0; k < 3; k++) {
            const top = y - height + k * height * 0.24;
            const half = height * (0.14 + k * 0.07) * 0.5;
            ctx.beginPath();
            ctx.moveTo(x, top);
            ctx.lineTo(x + half, top + height * 0.2);
            ctx.lineTo(x - half, top + height * 0.2);
            ctx.closePath();
            ctx.fill();
          }
        }
      },
    },
  ],

  back(ctx, w, h, t) {
    ctx.globalCompositeOperation = 'lighter';
    const step = Math.max(5, w / 150);
    for (const band of BANDS) {
      // Un único degradado de altura 1 que se estira en cada rayo: tenue arriba, intenso en la base.
      const ray = ctx.createLinearGradient(0, 0, 0, 1);
      ray.addColorStop(0, `rgba(${band.high}, 0)`);
      ray.addColorStop(0.45, `rgba(${band.high}, ${band.alpha * 0.35})`);
      ray.addColorStop(0.88, `rgba(${band.low}, ${band.alpha})`);
      ray.addColorStop(1, `rgba(${band.low}, 0)`);
      ctx.fillStyle = ray;
      for (let x = -step; x < w + step; x += step) {
        const k = (x / w) * TAU * band.waves;
        const bottom =
          h * (band.base + 0.07 * Math.sin(k + t * 0.22 + band.phase) + 0.025 * Math.sin(k * 3.3 - t * 0.35 + band.phase));
        const length = h * band.height * (0.7 + 0.3 * Math.sin(k * 1.9 + t * 0.3 + band.phase * 2));
        const shimmer = 0.55 + 0.45 * Math.sin(x * 0.045 + t * 0.9 + 3 * Math.sin(x * 0.013 + band.phase));
        ctx.globalAlpha = Math.max(0.12, shimmer);
        ctx.translate(x, bottom - length);
        ctx.scale(1, length);
        ctx.fillRect(0, 0, step + 0.6, 1);
        ctx.scale(1, 1 / length);
        ctx.translate(-x, length - bottom);
      }
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = 'source-over';
  },

  front(ctx, w, h, t, u) {
    // Nevada ligera.
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 44; i++) {
      const x = ((hash(i, 1) * w + Math.sin(t * 0.6 + i) * 16 * u + t * 6 * u) % (w + 20)) - 10;
      const y = ((hash(i, 2) * h + t * (16 + hash(i, 3) * 18) * u) % (h + 20)) - 10;
      ctx.globalAlpha = 0.3 + hash(i, 4) * 0.45;
      ctx.beginPath();
      ctx.arc(x, y, (1 + hash(i, 5) * 1.6) * u, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
};
