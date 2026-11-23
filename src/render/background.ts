import { DEFAULT_BACKGROUND, type BackgroundTheme } from '../game/backgrounds';
import { SCENES } from './scenes';
import { PAD, TAU, type Painter } from './scenes/common';
import { seededRandom } from './theme';

interface Twinkle {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
}

/**
 * Fondo ilustrado del juego. El cielo y cada capa de la escena elegida se pintan
 * una sola vez en lienzos auxiliares; por cuadro solo se componen y se dibujan
 * los pocos elementos animados.
 */
export class SceneBackground {
  private width = 0;
  private height = 0;
  private dpr = 1;
  private unit = 1;
  private sky: HTMLCanvasElement | null = null;
  private layers: HTMLCanvasElement[] = [];
  private twinkles: Twinkle[] = [];

  constructor(private theme: BackgroundTheme = DEFAULT_BACKGROUND) {}

  setTheme(theme: BackgroundTheme): void {
    if (theme === this.theme) return;
    this.theme = theme;
    this.rebuild();
  }

  resize(width: number, height: number, dpr: number): void {
    if (width <= 0 || height <= 0) return;
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.rebuild();
  }

  /** `motion` va de 0 (fondo estático) a 1 (parallax y animaciones). */
  draw(ctx: CanvasRenderingContext2D, time: number, motion: number): void {
    if (!this.sky) return;
    const scene = SCENES[this.theme];
    const { width, height, unit } = this;
    const sway = Math.sin(time * 0.07) * motion;
    const t = motion > 0 ? time : 0;

    ctx.drawImage(this.sky, -PAD + sway * 2, -PAD, width + PAD * 2, height + PAD * 2);

    if (this.twinkles.length > 0) {
      ctx.fillStyle = '#FFFFFF';
      for (const star of this.twinkles) {
        const shine = motion > 0 ? 0.45 + 0.55 * Math.sin(time * star.speed + star.phase) : 0.7;
        ctx.globalAlpha = Math.max(0.1, shine);
        ctx.beginPath();
        ctx.arc(star.x + sway * 2, star.y, star.r, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    if (scene.back) {
      ctx.save();
      scene.back(ctx, width, height, t, unit);
      ctx.restore();
    }
    this.layers.forEach((layer, index) => {
      ctx.drawImage(layer, -PAD + sway * scene.layers[index].drift, 0, width + PAD * 2, height);
    });
    if (scene.front) {
      ctx.save();
      scene.front(ctx, width, height, t, unit);
      ctx.restore();
    }
  }

  private rebuild(): void {
    const { width, height, dpr } = this;
    if (width <= 0 || height <= 0) return;
    const scene = SCENES[this.theme];
    this.unit = Math.max(0.3, Math.min(width, height) / 600);

    const sky = this.makeCanvas(width + PAD * 2, height + PAD * 2, dpr);
    scene.sky({ ...sky.painter, u: this.unit, rand: seededRandom(3) });
    this.sky = sky.canvas;

    this.layers = scene.layers.map((layer, index) => {
      const target = this.makeCanvas(width + PAD * 2, height, dpr);
      layer.paint({ ...target.painter, u: this.unit, rand: seededRandom(11 + index * 12) });
      return target.canvas;
    });

    const rand = seededRandom(5);
    this.twinkles = Array.from({ length: scene.twinkles }, () => ({
      x: rand() * width,
      y: rand() * height * 0.55,
      r: 0.8 + rand() * 1.3,
      phase: rand() * TAU,
      speed: 0.6 + rand() * 1.6,
    }));
  }

  private makeCanvas(width: number, height: number, dpr: number) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    const painter: Omit<Painter, 'u' | 'rand'> = { ctx, w: width, h: height };
    return { canvas, painter };
  }
}
