import type { AudioManager } from '../audio/audio';
import { Effects } from '../render/effects';
import { Renderer } from '../render/renderer';
import { COLORS } from '../render/theme';
import { GameEngine } from './engine';
import { POWERS } from './powers';
import type { Settings } from './storage';
import type {
  GameEvent,
  GameResult,
  HudState,
  Layout,
  PowerType,
  SubmitResult,
  WordEntity,
} from './types';
import { normalizeWord, type WordBank } from './words';

/** Alto de la franja bajo la línea roja, donde se ubica la caja de escritura. */
export const INPUT_ZONE_HEIGHT = 116;

/** Ancho reservado a la derecha para el panel de poderes: ahí no caen palabras. */
export function powerPanelReserve(width: number): number {
  return width >= 760 ? 112 : 88;
}

const ENDING_DURATION = 1.8;
const MAX_FRAME = 0.1;

export interface SessionOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  settings: Settings;
  audio: AudioManager;
  bank: WordBank;
  onHud: (hud: HudState) => void;
  onGameOver: (result: GameResult) => void;
}

/**
 * Une el motor, el renderizador, los efectos y el audio, y ejecuta el bucle de
 * animación con requestAnimationFrame. La interfaz de React solo habla con esta clase.
 */
export class GameSession {
  readonly engine: GameEngine;
  private readonly renderer: Renderer;
  private readonly fx: Effects;
  private readonly audio: AudioManager;
  private readonly onHud: (hud: HudState) => void;
  private readonly onGameOver: (result: GameResult) => void;

  private raf = 0;
  private lastTime = 0;
  private time = 0;
  private typed = '';
  private endingTime = -1;
  private finished = false;
  private hudKey = '';
  private needsDraw = true;
  private destroyed = false;

  constructor(options: SessionOptions) {
    this.audio = options.audio;
    this.onHud = options.onHud;
    this.onGameOver = options.onGameOver;
    this.renderer = new Renderer(options.canvas);
    this.renderer.setTextSize(options.settings.textSize);
    this.renderer.setBackground(options.settings.background);
    this.renderer.effectsLevel = options.settings.effects;
    this.fx = new Effects(options.settings.effects);
    this.renderer.resize(options.width, options.height, pixelRatio());
    this.engine = new GameEngine({
      layout: this.layoutFor(options.width, options.height),
      measure: this.renderer.measure,
      bank: options.bank,
      difficulty: options.settings.difficulty,
    });
  }

  start(): void {
    if (this.raf !== 0 || this.destroyed) return;
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this.frame);
    this.syncHud();
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.fx.clear();
  }

  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.renderer.resize(width, height, pixelRatio());
    this.engine.setLayout(this.layoutFor(width, height), this.renderer.measure);
    this.needsDraw = true;
  }

  setPaused(paused: boolean): void {
    if (paused) this.engine.pause();
    else this.engine.resume();
    this.lastTime = performance.now();
    this.needsDraw = true;
  }

  /** Texto que el jugador lleva escrito; se usa para resaltar coincidencias. */
  setTyped(text: string): void {
    this.typed = normalizeWord(text);
  }

  submit(text: string): SubmitResult {
    this.typed = '';
    return this.engine.submit(text);
  }

  activatePower(power: PowerType): boolean {
    return this.engine.activatePower(power);
  }

  /** Cierra el resumen del nivel y lanza la cuenta regresiva del siguiente. */
  continueToNextLevel(): boolean {
    return this.engine.continueToNextLevel();
  }

  // ---------------------------------------------------------------------------

  private layoutFor(width: number, height: number): Layout {
    return {
      width: Math.max(260, width - powerPanelReserve(width)),
      height: Math.max(160, height - INPUT_ZONE_HEIGHT),
      tokenHeight: this.renderer.tokenHeight,
    };
  }

  private frame = (now: number): void => {
    if (this.destroyed) return;
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(MAX_FRAME, Math.max(0, (now - this.lastTime) / 1000));
    this.lastTime = now;

    const active = !this.engine.paused;
    if (active) {
      this.engine.update(dt);
      for (const event of this.engine.drainEvents()) this.handleEvent(event);
      this.fx.update(dt);
      this.time += dt;
      if (this.endingTime >= 0 && !this.finished) {
        this.endingTime += dt;
        if (this.endingTime >= ENDING_DURATION) {
          this.finished = true;
          this.onGameOver(this.engine.getResult());
        }
      }
    }

    if (active || this.needsDraw) {
      this.needsDraw = false;
      const engine = this.engine;
      this.renderer.draw(
        {
          words: engine.words,
          layout: engine.layout,
          typed: this.typed,
          frozen: engine.frozen,
          slowAmount: Math.min(1, Math.max(0, (1 - engine.speedScale) / 0.65)),
          time: this.time,
          ending: this.endingTime < 0 ? 0 : Math.min(1, this.endingTime / ENDING_DURATION),
          endingTitle: !this.finished,
        },
        this.fx,
      );
    }
    this.syncHud();
  };

  private syncHud(): void {
    const hud = this.engine.getHud();
    const inv = hud.inventory;
    const key = [
      hud.score,
      hud.level,
      hud.lives,
      hud.streak,
      inv.freeze,
      inv.slow,
      inv.lightning,
      inv.bomb,
      Math.ceil(hud.freezeLeft * 10),
      Math.ceil(hud.slowLeft * 10),
      Math.round(hud.levelProgress * 100),
      hud.phase,
      hud.countdown,
      hud.lastWords ? 1 : 0,
    ].join('|');
    if (key === this.hudKey) return;
    this.hudKey = key;
    this.onHud(hud);
  }

  private center(word: WordEntity): { x: number; y: number } {
    return { x: word.x + word.width / 2, y: word.y + this.engine.layout.tokenHeight / 2 };
  }

  /** Traduce lo ocurrido en el motor a efectos visuales y sonidos. */
  private handleEvent(event: GameEvent): void {
    const fx = this.fx;
    const layout = this.engine.layout;
    const tokenH = layout.tokenHeight;

    switch (event.type) {
      case 'wordCleared': {
        const { word, points, cause } = event;
        const c = this.center(word);
        const color =
          cause === 'lightning'
            ? COLORS.yellow
            : cause === 'bomb'
              ? COLORS.violet
              : word.power
                ? POWERS[word.power].color
                : COLORS.electric;
        if (cause === 'lightning') fx.lightning(c.x, c.y);
        fx.burst(word.x, word.y, word.width, tokenH, color, cause === 'typed' ? 30 : 22);
        fx.floatText(c.x, word.y - 4, `+${points}`, cause === 'typed' ? COLORS.yellow : color);
        if (cause === 'typed') this.audio.play('clear');
        break;
      }
      case 'powerGained': {
        const info = POWERS[event.power];
        const c = this.center(event.word);
        fx.floatText(
          c.x,
          event.word.y + tokenH + 14,
          event.stored ? `${info.name} +1` : `${info.name}: inventario lleno`,
          info.color,
          18,
        );
        this.audio.play('powerGain');
        break;
      }
      case 'miss':
        fx.flash('255, 56, 92', 0.2, 3.2);
        this.audio.play('error');
        break;
      case 'lifeLost': {
        const word = event.word;
        fx.burst(word.x, word.y, word.width, tokenH, COLORS.red, 34);
        fx.flash('255, 56, 92', 0.34, 2);
        fx.shake(7, 0.45);
        if (event.livesLeft > 0) this.audio.play('lifeLost');
        break;
      }
      case 'wordExpired':
        fx.burst(event.word.x, event.word.y, event.word.width, tokenH, '#7C8FB5', 12);
        break;
      case 'levelComplete':
        fx.flash('255, 213, 74', 0.22, 2);
        this.audio.play('levelUp');
        break;
      case 'countdownTick':
        this.audio.play(event.value > 0 ? 'tick' : 'go');
        break;
      case 'levelStart':
        fx.flash('0, 217, 255', 0.14, 2.6);
        break;
      case 'powerActivated':
        this.audio.play(event.power);
        if (event.power === 'freeze') {
          fx.flash('155, 235, 255', 0.38, 1.8);
          fx.snow(layout.width, layout.height);
        } else if (event.power === 'slow') {
          fx.flash('90, 160, 255', 0.2, 2);
          fx.ring(layout.width / 2, layout.height / 2, Math.max(layout.width, layout.height) * 0.7, '90, 160, 255', 0.8);
        } else if (event.power === 'lightning') {
          fx.flash('255, 244, 190', 0.3, 3.2);
        } else {
          fx.flash('168, 85, 247', 0.4, 1.8);
          fx.ring(layout.width / 2, layout.height / 2, Math.max(layout.width, layout.height) * 0.8, '168, 85, 247', 0.7);
          fx.ring(layout.width / 2, layout.height / 2, Math.max(layout.width, layout.height) * 0.5, '255, 213, 74', 0.5);
          fx.shake(6, 0.45);
        }
        break;
      case 'powerDenied':
        this.audio.play('denied');
        break;
      case 'gameOver':
        this.endingTime = 0;
        for (const word of this.engine.words) {
          fx.burst(word.x, word.y, word.width, tokenH, word.power ? POWERS[word.power].color : COLORS.electric, 18);
        }
        this.engine.words.length = 0;
        this.audio.stopMusic();
        this.audio.play('gameOver');
        break;
      case 'spawn':
      case 'powerEnded':
        break;
    }
  }
}

function pixelRatio(): number {
  return Math.min(2, window.devicePixelRatio || 1);
}
