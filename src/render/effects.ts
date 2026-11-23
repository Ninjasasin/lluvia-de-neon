import type { EffectsLevel } from '../game/storage';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
}

export interface Floater {
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface Bolt {
  points: { x: number; y: number }[];
  life: number;
  maxLife: number;
}

export interface Ring {
  x: number;
  y: number;
  maxRadius: number;
  /** "r, g, b" */
  rgb: string;
  life: number;
  maxLife: number;
}

export interface Flash {
  rgb: string;
  alpha: number;
  decay: number;
}

export interface Banner {
  title: string;
  subtitle: string;
  life: number;
  maxLife: number;
}

const MAX_PARTICLES = 700;

/**
 * Estado de los efectos visuales (partículas, textos flotantes, rayos, destellos…).
 * Solo guarda y actualiza datos: el dibujo lo hace el renderizador.
 */
export class Effects {
  particles: Particle[] = [];
  floaters: Floater[] = [];
  bolts: Bolt[] = [];
  rings: Ring[] = [];
  flashes: Flash[] = [];
  banner: Banner | null = null;

  private shakeTime = 0;
  private shakeDuration = 0;
  private shakeAmp = 0;

  constructor(public level: EffectsLevel = 'full') {}

  /** Proporción de partículas según la intensidad elegida. */
  private get density(): number {
    return this.level === 'full' ? 1 : this.level === 'reduced' ? 0.4 : 0;
  }

  /** Desintegra un rectángulo (una ficha) en partículas luminosas. */
  burst(x: number, y: number, w: number, h: number, color: string, amount = 26): void {
    const count = Math.round(amount * this.density);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 190;
      this.addParticle({
        x: x + Math.random() * w,
        y: y + Math.random() * h,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.5,
        size: 2.5 + Math.random() * 3.5,
        color: Math.random() < 0.3 ? '#FFFFFF' : color,
        gravity: 160,
      });
    }
  }

  /** Copos que caen por toda el área al congelar. */
  snow(width: number, height: number): void {
    const count = Math.round(70 * this.density);
    for (let i = 0; i < count; i++) {
      this.addParticle({
        x: Math.random() * width,
        y: Math.random() * height * 0.9,
        vx: -15 + Math.random() * 30,
        vy: 20 + Math.random() * 50,
        life: 0,
        maxLife: 1.2 + Math.random() * 1.4,
        size: 1.5 + Math.random() * 2.5,
        color: Math.random() < 0.5 ? '#FFFFFF' : '#9BEBFF',
        gravity: 0,
      });
    }
  }

  floatText(x: number, y: number, text: string, color: string, size = 22): void {
    this.floaters.push({ x, y, text, color, size, life: 0, maxLife: 1.1 });
    if (this.floaters.length > 40) this.floaters.shift();
  }

  /** Rayo quebrado desde lo alto hasta el punto indicado. */
  lightning(toX: number, toY: number): void {
    const points: { x: number; y: number }[] = [];
    const startX = toX + (Math.random() - 0.5) * 160;
    const segments = 9;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const jitter = i === 0 || i === segments ? 0 : (Math.random() - 0.5) * 46;
      points.push({ x: startX + (toX - startX) * t + jitter, y: -10 + (toY + 10) * t });
    }
    this.bolts.push({ points, life: 0, maxLife: 0.38 });
  }

  ring(x: number, y: number, maxRadius: number, rgb: string, duration = 0.6): void {
    this.rings.push({ x, y, maxRadius, rgb, life: 0, maxLife: duration });
  }

  flash(rgb: string, alpha: number, decay = 2.4): void {
    const scale = this.level === 'full' ? 1 : this.level === 'reduced' ? 0.6 : 0.35;
    this.flashes.push({ rgb, alpha: alpha * scale, decay });
    if (this.flashes.length > 6) this.flashes.shift();
  }

  shake(amplitude: number, duration: number): void {
    if (this.level === 'minimal') return;
    this.shakeAmp = this.level === 'reduced' ? amplitude * 0.5 : amplitude;
    this.shakeDuration = duration;
    this.shakeTime = duration;
  }

  showBanner(title: string, subtitle: string, duration = 2): void {
    this.banner = { title, subtitle, life: 0, maxLife: duration };
  }

  /** Desplazamiento actual de la vibración de pantalla. */
  shakeOffset(): { x: number; y: number } {
    if (this.shakeTime <= 0) return { x: 0, y: 0 };
    const strength = this.shakeAmp * (this.shakeTime / this.shakeDuration);
    return { x: (Math.random() - 0.5) * 2 * strength, y: (Math.random() - 0.5) * 2 * strength };
  }

  update(dt: number): void {
    this.shakeTime = Math.max(0, this.shakeTime - dt);

    for (const p of this.particles) {
      p.life += dt;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.particles = this.particles.filter((p) => p.life < p.maxLife);

    for (const f of this.floaters) {
      f.life += dt;
      f.y -= 46 * dt;
    }
    this.floaters = this.floaters.filter((f) => f.life < f.maxLife);

    for (const b of this.bolts) b.life += dt;
    this.bolts = this.bolts.filter((b) => b.life < b.maxLife);

    for (const r of this.rings) r.life += dt;
    this.rings = this.rings.filter((r) => r.life < r.maxLife);

    for (const f of this.flashes) f.alpha -= f.decay * dt * Math.max(0.25, f.alpha);
    this.flashes = this.flashes.filter((f) => f.alpha > 0.01);

    if (this.banner) {
      this.banner.life += dt;
      if (this.banner.life >= this.banner.maxLife) this.banner = null;
    }
  }

  clear(): void {
    this.particles = [];
    this.floaters = [];
    this.bolts = [];
    this.rings = [];
    this.flashes = [];
    this.banner = null;
    this.shakeTime = 0;
  }

  private addParticle(p: Particle): void {
    if (this.particles.length >= MAX_PARTICLES) this.particles.shift();
    this.particles.push(p);
  }
}
