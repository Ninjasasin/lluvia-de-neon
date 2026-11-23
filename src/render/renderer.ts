import { POWERS } from '../game/powers';
import type { BackgroundTheme } from '../game/backgrounds';
import type { EffectsLevel, TextSize } from '../game/storage';
import type { Layout, MeasureFn, WordEntity } from '../game/types';
import { SceneBackground } from './background';
import type { Effects } from './effects';
import { drawPowerIcon } from './icons';
import { COLORS, FONT_FAMILY, rgbTriplet, roundRectPath } from './theme';

export interface RenderFrame {
  words: readonly WordEntity[];
  layout: Layout;
  /** Texto escrito por el jugador, ya normalizado. */
  typed: string;
  frozen: boolean;
  /** 0 velocidad normal … 1 totalmente ralentizado. */
  slowAmount: number;
  time: number;
  /** Progreso de la transición de fin de partida (0 = no ha empezado, 1 = completa). */
  ending: number;
  /** Muestra el rótulo de la transición; se oculta cuando aparece la pantalla de resultados. */
  endingTitle: boolean;
}

const FONT_SIZES: Record<TextSize, number> = { small: 20, medium: 24, large: 29 };

const BORDER_NORMAL: [number, number, number] = [207, 239, 255];
const BORDER_DANGER: [number, number, number] = [255, 56, 92];

/** Dibuja la partida en el Canvas. No modifica el estado del juego. */
export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly background = new SceneBackground();
  private readonly widths = new Map<string, number>();
  private width = 0;
  private height = 0;
  private dpr = 1;
  private fontSize = FONT_SIZES.medium;
  effectsLevel: EffectsLevel = 'full';

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('El navegador no permite dibujar en Canvas 2D.');
    this.ctx = ctx;
  }

  get tokenHeight(): number {
    return Math.round(this.fontSize * 1.9);
  }

  private get padX(): number {
    return Math.round(this.fontSize * 0.78);
  }

  private get iconSize(): number {
    return Math.round(this.fontSize * 1.1);
  }

  private get font(): string {
    return `800 ${this.fontSize}px ${FONT_FAMILY}`;
  }

  setBackground(theme: BackgroundTheme): void {
    this.background.setTheme(theme);
  }

  setTextSize(size: TextSize): void {
    this.fontSize = FONT_SIZES[size];
    this.widths.clear();
  }

  resize(width: number, height: number, dpr: number): void {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(width * dpr));
    this.canvas.height = Math.max(1, Math.round(height * dpr));
    this.background.resize(width, height, dpr);
  }

  /** Ancho de la ficha de una palabra, con margen y hueco para el icono si otorga un poder. */
  measure: MeasureFn = (text, power) => {
    const cacheKey = `${power ? 1 : 0}|${text}`;
    let width = this.widths.get(cacheKey);
    if (width === undefined) {
      this.ctx.font = this.font;
      const extra = power ? this.iconSize + 8 : 0;
      width = Math.ceil(this.ctx.measureText(text).width + this.padX * 2 + extra);
      this.widths.set(cacheKey, width);
    }
    return width;
  };

  draw(frame: RenderFrame, fx: Effects): void {
    const ctx = this.ctx;
    const { width, height } = this;
    if (width <= 0 || height <= 0) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(0, 0, width, height);

    const shake = fx.shakeOffset();
    ctx.save();
    ctx.translate(shake.x, shake.y);

    this.background.draw(ctx, frame.time, this.effectsLevel === 'full' ? 1 : 0);
    this.drawAmbience(frame);
    this.drawDangerZone(frame);

    const ordered = [...frame.words].sort((a, b) => a.y - b.y);
    if (frame.slowAmount > 0.02 && !frame.frozen) {
      for (const word of ordered) this.drawTrail(word, frame.slowAmount);
    }
    for (const word of ordered) this.drawToken(word, frame);

    this.drawRings(fx);
    this.drawBolts(fx);
    this.drawParticles(fx);
    this.drawFloaters(fx);
    ctx.restore();

    for (const flash of fx.flashes) {
      ctx.fillStyle = `rgba(${flash.rgb}, ${Math.max(0, flash.alpha)})`;
      ctx.fillRect(0, 0, width, height);
    }
    this.drawBanner(fx, frame.layout);
    if (frame.ending > 0) this.drawEnding(frame.ending, frame.endingTitle);
  }

  // ---------------------------------------------------------------------------

  private drawAmbience(frame: RenderFrame): void {
    const ctx = this.ctx;
    const { width, height } = this;
    if (frame.slowAmount > 0.02) {
      ctx.fillStyle = `rgba(70, 130, 255, ${0.09 * frame.slowAmount})`;
      ctx.fillRect(0, 0, width, height);
    }
    if (frame.frozen) {
      ctx.fillStyle = 'rgba(140, 225, 255, 0.08)';
      ctx.fillRect(0, 0, width, height);
      const frost = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.35,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75,
      );
      frost.addColorStop(0, 'rgba(190, 240, 255, 0)');
      frost.addColorStop(1, 'rgba(190, 240, 255, 0.30)');
      ctx.fillStyle = frost;
      ctx.fillRect(0, 0, width, height);
    }
  }

  /** Línea roja de peligro y franja inferior donde va la caja de escritura. */
  private drawDangerZone(frame: RenderFrame): void {
    const ctx = this.ctx;
    const y = frame.layout.height;
    const zone = ctx.createLinearGradient(0, y, 0, this.height);
    zone.addColorStop(0, 'rgba(5, 12, 30, 0.86)');
    zone.addColorStop(1, 'rgba(3, 8, 20, 0.96)');
    ctx.fillStyle = zone;
    ctx.fillRect(-20, y, this.width + 40, this.height - y + 20);

    const pulse = 0.75 + 0.25 * Math.sin(frame.time * 3.2);
    const glow = ctx.createLinearGradient(0, y - 26, 0, y);
    glow.addColorStop(0, 'rgba(255, 56, 92, 0)');
    glow.addColorStop(1, `rgba(255, 56, 92, ${0.22 * pulse})`);
    ctx.fillStyle = glow;
    ctx.fillRect(-20, y - 26, this.width + 40, 26);

    ctx.save();
    ctx.shadowColor = COLORS.red;
    ctx.shadowBlur = 18 * pulse;
    ctx.strokeStyle = COLORS.red;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-20, y);
    ctx.lineTo(this.width + 20, y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 220, 228, 0.9)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  /** Estela azul suave sobre las palabras ralentizadas. */
  private drawTrail(word: WordEntity, amount: number): void {
    const ctx = this.ctx;
    const length = this.tokenHeight * 1.5;
    const inset = this.tokenHeight * 0.3;
    const trail = ctx.createLinearGradient(0, word.y - length, 0, word.y + this.tokenHeight * 0.5);
    trail.addColorStop(0, 'rgba(90, 170, 255, 0)');
    trail.addColorStop(1, `rgba(90, 170, 255, ${0.3 * amount})`);
    ctx.fillStyle = trail;
    ctx.fillRect(word.x + inset, word.y - length, word.width - inset * 2, length + this.tokenHeight * 0.5);
  }

  private drawToken(word: WordEntity, frame: RenderFrame): void {
    const ctx = this.ctx;
    const h = this.tokenHeight;
    const w = word.width;
    const appear = Math.min(1, word.age / 0.28);
    const ease = 1 - Math.pow(1 - appear, 3);
    const scale = 0.8 + 0.2 * ease;

    const dangerStart = frame.layout.height * 0.7;
    const danger = Math.min(1, Math.max(0, (word.y + h - dangerStart) / (frame.layout.height - dangerStart)));

    let border: string;
    let glowRgb: string;
    if (frame.frozen) {
      border = COLORS.ice;
      glowRgb = '155, 235, 255';
    } else if (word.power) {
      border = POWERS[word.power].color;
      glowRgb = rgbTriplet(border);
    } else if (danger > 0) {
      const mix = danger * (0.75 + 0.25 * Math.sin(frame.time * 9));
      const rgb = BORDER_NORMAL.map((c, i) => Math.round(c + (BORDER_DANGER[i] - c) * mix));
      border = `rgb(${rgb.join(', ')})`;
      glowRgb = danger > 0.4 ? '255, 56, 92' : '0, 217, 255';
    } else {
      border = `rgb(${BORDER_NORMAL.join(', ')})`;
      glowRgb = '0, 217, 255';
    }

    ctx.save();
    ctx.globalAlpha = ease;
    ctx.translate(word.x + w / 2, word.y + h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-w / 2, -h / 2);

    // Cuerpo de la ficha con sombra luminosa.
    const radius = h * 0.3;
    roundRectPath(ctx, 0, 0, w, h, radius);
    const body = ctx.createLinearGradient(0, 0, 0, h);
    if (frame.frozen) {
      body.addColorStop(0, 'rgba(40, 120, 170, 0.88)');
      body.addColorStop(1, 'rgba(14, 62, 110, 0.9)');
    } else {
      body.addColorStop(0, 'rgba(18, 44, 92, 0.9)');
      body.addColorStop(1, 'rgba(7, 21, 46, 0.9)');
    }
    const pulse = word.power ? 0.75 + 0.25 * Math.sin(frame.time * 5 + word.id) : 0.6;
    ctx.shadowColor = `rgba(${glowRgb}, ${pulse})`;
    ctx.shadowBlur = word.power ? 22 : 14;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = body;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.lineWidth = word.power || frame.frozen ? 3 : 2.5;
    ctx.strokeStyle = border;
    ctx.stroke();

    // Brillo interior en la mitad superior.
    roundRectPath(ctx, 3, 3, w - 6, h * 0.42, radius * 0.75);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.fill();

    // Icono del poder.
    let textX = this.padX;
    if (word.power) {
      const size = this.iconSize;
      drawPowerIcon(ctx, word.power, this.padX - 2 + size / 2, h / 2, size, POWERS[word.power].color);
      textX += size + 6;
    }

    // Texto: blanco, con las letras ya escritas resaltadas.
    ctx.font = this.font;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = COLORS.white;
    ctx.fillText(word.text, textX, h / 2 + 1);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    if (frame.typed.length > 0 && word.key.startsWith(frame.typed)) {
      const complete = word.key === frame.typed;
      ctx.fillStyle = complete ? COLORS.yellow : '#5EEBFF';
      ctx.fillText(word.text.slice(0, frame.typed.length), textX, h / 2 + 1);
    }

    if (frame.frozen) this.drawFrost(word, w, h);
    ctx.restore();
  }

  /** Escarcha sobre una ficha congelada: capa de nieve arriba y carámbanos abajo. */
  private drawFrost(word: WordEntity, w: number, h: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(235, 250, 255, 0.92)';
    const bumps = Math.max(3, Math.floor(w / 22));
    const step = (w - 16) / bumps;
    ctx.beginPath();
    ctx.moveTo(8, 2);
    for (let i = 0; i < bumps; i++) {
      const x0 = 8 + i * step;
      const lift = 3 + ((word.id * 7 + i * 13) % 5);
      ctx.quadraticCurveTo(x0 + step / 2, -lift, x0 + step, 2);
    }
    ctx.lineTo(w - 8, 5);
    ctx.lineTo(8, 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(190, 238, 255, 0.85)';
    const icicles = Math.max(2, Math.floor(w / 46));
    for (let i = 0; i < icicles; i++) {
      const x = 14 + ((word.id * 31 + i * 57) % Math.max(1, Math.floor(w - 28)));
      const length = 6 + ((word.id * 5 + i * 11) % 8);
      ctx.beginPath();
      ctx.moveTo(x - 3.5, h - 1);
      ctx.lineTo(x + 3.5, h - 1);
      ctx.lineTo(x, h + length);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawRings(fx: Effects): void {
    const ctx = this.ctx;
    for (const ring of fx.rings) {
      const t = ring.life / ring.maxLife;
      const radius = ring.maxRadius * (1 - Math.pow(1 - t, 3));
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ring.rgb}, ${0.16 * (1 - t)})`;
      ctx.fill();
      ctx.lineWidth = 2 + 8 * (1 - t);
      ctx.strokeStyle = `rgba(${ring.rgb}, ${0.9 * (1 - t)})`;
      ctx.stroke();
    }
  }

  private drawBolts(fx: Effects): void {
    const ctx = this.ctx;
    if (fx.bolts.length === 0) return;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (const bolt of fx.bolts) {
      const t = bolt.life / bolt.maxLife;
      const alpha = (1 - t) * (0.7 + 0.3 * Math.sin(bolt.life * 90));
      ctx.beginPath();
      bolt.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.shadowColor = COLORS.yellow;
      ctx.shadowBlur = 22;
      ctx.strokeStyle = `rgba(255, 213, 74, ${alpha})`;
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawParticles(fx: Effects): void {
    const ctx = this.ctx;
    if (fx.particles.length === 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of fx.particles) {
      const t = p.life / p.maxLife;
      ctx.globalAlpha = Math.max(0, 1 - t);
      ctx.fillStyle = p.color;
      const size = p.size * (1 - t * 0.5);
      ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
    }
    ctx.restore();
  }

  private drawFloaters(fx: Effects): void {
    const ctx = this.ctx;
    if (fx.floaters.length === 0) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    for (const f of fx.floaters) {
      const t = f.life / f.maxLife;
      const pop = Math.min(1, f.life / 0.12);
      ctx.globalAlpha = t < 0.6 ? 1 : Math.max(0, 1 - (t - 0.6) / 0.4);
      ctx.font = `800 ${Math.round(f.size * (0.7 + 0.3 * pop))}px ${FONT_FAMILY}`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(4, 10, 28, 0.85)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();
  }

  /** Anuncio central (por ejemplo, al subir de nivel). */
  private drawBanner(fx: Effects, layout: Layout): void {
    const banner = fx.banner;
    if (!banner) return;
    const ctx = this.ctx;
    const t = banner.life;
    const enter = Math.min(1, t / 0.35);
    const exit = Math.min(1, Math.max(0, (banner.maxLife - t) / 0.45));
    const overshoot = 1 + 0.25 * Math.sin(enter * Math.PI) * (1 - enter * 0.5);
    const scale = (0.6 + 0.4 * enter) * overshoot;
    const cx = layout.width / 2;
    const cy = layout.height * 0.4;

    ctx.save();
    ctx.globalAlpha = Math.min(enter, exit);
    const band = ctx.createLinearGradient(0, cy - 70, 0, cy + 70);
    band.addColorStop(0, 'rgba(7, 21, 46, 0)');
    band.addColorStop(0.5, 'rgba(7, 21, 46, 0.72)');
    band.addColorStop(1, 'rgba(7, 21, 46, 0)');
    ctx.fillStyle = band;
    ctx.fillRect(0, cy - 70, this.width, 140);

    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 54px ${FONT_FAMILY}`;
    ctx.shadowColor = COLORS.yellow;
    ctx.shadowBlur = 26;
    ctx.fillStyle = COLORS.yellow;
    ctx.fillText(banner.title, 0, -10);
    ctx.shadowBlur = 0;
    ctx.font = `700 20px ${FONT_FAMILY}`;
    ctx.fillStyle = COLORS.white;
    ctx.fillText(banner.subtitle, 0, 34);
    ctx.restore();
  }

  /** Transición de fin de partida: bandas de cine, oscurecimiento y rótulo. */
  private drawEnding(progress: number, showTitle: boolean): void {
    const ctx = this.ctx;
    const { width, height } = this;
    const ease = 1 - Math.pow(1 - progress, 2);
    ctx.save();
    ctx.fillStyle = `rgba(3, 7, 18, ${0.72 * ease})`;
    ctx.fillRect(0, 0, width, height);
    const bar = height * 0.11 * ease;
    ctx.fillStyle = '#02050D';
    ctx.fillRect(0, 0, width, bar);
    ctx.fillRect(0, height - bar, width, bar);

    const textAlpha = Math.min(1, Math.max(0, (progress - 0.2) / 0.35));
    if (showTitle && textAlpha > 0) {
      ctx.globalAlpha = textAlpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const size = Math.max(30, Math.min(64, width * 0.07));
      ctx.font = `900 ${size}px ${FONT_FAMILY}`;
      ctx.shadowColor = COLORS.red;
      ctx.shadowBlur = 30;
      ctx.fillStyle = COLORS.red;
      const spread = 1 + (1 - textAlpha) * 0.25;
      ctx.translate(width / 2, height * 0.42);
      ctx.scale(spread, spread);
      ctx.fillText('FIN DE LA PARTIDA', 0, 0);
    }
    ctx.restore();
  }
}
