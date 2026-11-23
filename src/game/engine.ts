import {
  BOMB_SCORE_FACTOR,
  COUNTDOWN_GO_HOLD,
  COUNTDOWN_SECONDS,
  FIELD_MARGIN_X,
  FIELD_TOP_Y,
  FREEZE_DURATION,
  INITIAL_LIVES,
  LEVEL_DURATION,
  LIGHTNING_SCORE_FACTOR,
  LIGHTNING_TARGETS,
  MAX_POWER_STOCK,
  MAX_STEP,
  POWER_FIRST_DELAY,
  POWER_MIN_GAP,
  POWER_SPAWN_CHANCE,
  SLOW_DURATION,
  SLOW_FACTOR,
  SPEED_EASE_RATE,
  TOKEN_GAP,
} from './constants';
import { paramsForLevel, type LevelParams } from './difficulty';
import { pickPower } from './powers';
import {
  accuracyPercent,
  levelBonus,
  multiplierForStreak,
  wordPoints,
  wordsPerMinute,
} from './scoring';
import type {
  ClearCause,
  Difficulty,
  GameEvent,
  GamePhase,
  GameResult,
  HudState,
  Inventory,
  Layout,
  LevelSummary,
  MeasureFn,
  PowerType,
  SubmitResult,
  WordEntity,
} from './types';
import { letterCount, normalizeWord, type WordBank } from './words';

export interface EngineConfig {
  layout: Layout;
  measure: MeasureFn;
  bank: WordBank;
  difficulty?: Difficulty;
  /** Generador de números en [0, 1). Permite partidas deterministas en las pruebas. */
  rng?: () => number;
  /** Si es false no aparecen palabras solas: se colocan con `spawnWord`. Por defecto, true. */
  autoSpawn?: boolean;
}

export interface EngineStats {
  /** Palabras eliminadas por cualquier medio. */
  wordsCleared: number;
  /** Palabras eliminadas escribiéndolas. */
  wordsTyped: number;
  attempts: number;
  hits: number;
  correctChars: number;
  powersUsed: number;
}

/** Contadores que se reinician al comenzar cada nivel. */
interface LevelStats {
  wordsCleared: number;
  attempts: number;
  hits: number;
  correctChars: number;
  points: number;
  bestStreak: number;
  livesLost: number;
  time: number;
}

/**
 * Lógica pura de la partida: no conoce el Canvas, el DOM ni el audio.
 * Se avanza con `update(dt)` y comunica lo ocurrido mediante una cola de eventos.
 */
export class GameEngine {
  words: WordEntity[] = [];
  score = 0;
  level = 1;
  lives = INITIAL_LIVES;
  streak = 0;
  bestStreak = 0;
  inventory: Inventory = { freeze: 0, slow: 0, lightning: 0, bomb: 0 };
  freezeLeft = 0;
  slowLeft = 0;
  /** Factor de velocidad suavizado: 1 normal, 0,35 ralentizado. */
  speedScale = 1;
  levelTime = 0;
  /** Segundos de juego activo (no cuenta el tiempo en pausa). */
  elapsed = 0;
  over = false;
  paused = false;
  stats: EngineStats = emptyStats();
  phase: GamePhase = 'playing';
  /** Resumen del nivel superado; solo existe durante la fase de resumen. */
  summary: LevelSummary | null = null;

  readonly difficulty: Difficulty;
  layout: Layout;

  private measure: MeasureFn;
  private readonly bank: WordBank;
  private readonly rng: () => number;
  private readonly autoSpawn: boolean;
  private events: GameEvent[] = [];
  private spawnTimer = 0;
  private lastPowerAt = 0;
  private nextId = 1;
  private fallTime = 0;
  private levelStats: LevelStats = emptyLevelStats();
  private countdownLeft = 0;
  private lastTick = 0;

  constructor(config: EngineConfig) {
    this.layout = { ...config.layout };
    this.measure = config.measure;
    this.bank = config.bank;
    this.difficulty = config.difficulty ?? 'normal';
    this.rng = config.rng ?? Math.random;
    this.autoSpawn = config.autoSpawn ?? true;
    this.reset();
  }

  /** Deja el motor como al iniciar una partida nueva. */
  reset(): void {
    this.words = [];
    this.score = 0;
    this.level = 1;
    this.lives = INITIAL_LIVES;
    this.streak = 0;
    this.bestStreak = 0;
    this.inventory = { freeze: 0, slow: 0, lightning: 0, bomb: 0 };
    this.freezeLeft = 0;
    this.slowLeft = 0;
    this.speedScale = 1;
    this.levelTime = 0;
    this.elapsed = 0;
    this.over = false;
    this.paused = false;
    this.stats = emptyStats();
    this.phase = 'playing';
    this.summary = null;
    this.levelStats = emptyLevelStats();
    this.countdownLeft = 0;
    this.lastTick = 0;
    this.events = [];
    this.spawnTimer = 0.8;
    this.lastPowerAt = POWER_FIRST_DELAY - POWER_MIN_GAP;
    this.nextId = 1;
    this.fallTime = this.params.fallTime;
    this.bank.resetHistory();
  }

  get params(): LevelParams {
    return paramsForLevel(this.level, this.difficulty);
  }

  get frozen(): boolean {
    return this.freezeLeft > 0;
  }

  get multiplier(): number {
    return multiplierForStreak(this.streak);
  }

  /** El nivel ya agotó su tiempo: no aparecen más palabras y termina al despejar la pantalla. */
  get lastWords(): boolean {
    return this.phase === 'playing' && this.levelTime >= LEVEL_DURATION;
  }

  /** Número que muestra la cuenta regresiva: de 5 a 0. */
  get countdownValue(): number {
    if (this.phase !== 'countdown') return 0;
    return Math.max(0, Math.ceil(this.countdownLeft - COUNTDOWN_GO_HOLD));
  }

  /** Velocidad de caída actual en píxeles por segundo. */
  get fallSpeed(): number {
    if (this.frozen) return 0;
    return (this.layout.height / this.fallTime) * this.speedScale;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  /** Avanza la simulación. No hace nada en pausa ni tras el fin de la partida. */
  update(dt: number): void {
    if (this.paused || this.over || !(dt > 0)) return;
    let remaining = dt;
    while (remaining > 1e-9 && !this.over) {
      const step = Math.min(remaining, MAX_STEP);
      this.step(step);
      remaining -= step;
    }
  }

  /**
   * Cierra el resumen del nivel superado e inicia la cuenta regresiva del siguiente.
   * Devuelve false si no se está mostrando un resumen.
   */
  continueToNextLevel(): boolean {
    if (this.phase !== 'summary' || this.over || this.paused) return false;
    this.summary = null;
    this.level++;
    this.levelTime = 0;
    this.levelStats = emptyLevelStats();
    this.fallTime = this.params.fallTime;
    this.phase = 'countdown';
    this.countdownLeft = COUNTDOWN_SECONDS + COUNTDOWN_GO_HOLD;
    this.lastTick = COUNTDOWN_SECONDS;
    this.events.push({ type: 'countdownTick', value: COUNTDOWN_SECONDS });
    return true;
  }

  /** Procesa un intento confirmado con Enter. */
  submit(text: string): SubmitResult {
    if (this.over || this.paused || this.phase !== 'playing') return { kind: 'empty' };
    const key = normalizeWord(text);
    if (key.length === 0) return { kind: 'empty' };
    this.stats.attempts++;
    this.levelStats.attempts++;

    let target: WordEntity | null = null;
    for (const word of this.words) {
      if (word.key === key && (target === null || word.y > target.y)) target = word;
    }
    if (target === null) {
      this.streak = 0;
      this.events.push({ type: 'miss', text: key });
      return { kind: 'miss' };
    }

    this.streak++;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    this.stats.hits++;
    this.stats.wordsTyped++;
    this.stats.correctChars += target.letters;
    this.levelStats.hits++;
    this.levelStats.correctChars += target.letters;
    this.levelStats.bestStreak = Math.max(this.levelStats.bestStreak, this.streak);
    const points = this.clearWord(target, 'typed', 1);
    if (target.power) {
      const stored = this.inventory[target.power] < MAX_POWER_STOCK;
      if (stored) this.inventory[target.power]++;
      this.events.push({ type: 'powerGained', power: target.power, word: target, stored });
    }
    return { kind: 'hit', points, word: target };
  }

  /** Activa un poder almacenado. Devuelve false si no se pudo usar. */
  activatePower(power: PowerType): boolean {
    if (this.over || this.paused || this.phase !== 'playing') return false;
    if (this.inventory[power] <= 0) {
      this.events.push({ type: 'powerDenied', power, reason: 'empty' });
      return false;
    }

    let targets: WordEntity[] = [];
    if (power === 'lightning' || power === 'bomb') {
      const normal = this.words.filter((w) => w.power === null).sort((a, b) => b.y - a.y);
      targets = power === 'lightning' ? normal.slice(0, LIGHTNING_TARGETS) : normal;
      if (targets.length === 0) {
        this.events.push({ type: 'powerDenied', power, reason: 'noTargets' });
        return false;
      }
    }

    this.inventory[power]--;
    this.stats.powersUsed++;
    // Congelar y Ralentizar reinician su duración: nunca se acumulan.
    if (power === 'freeze') this.freezeLeft = FREEZE_DURATION;
    if (power === 'slow') this.slowLeft = SLOW_DURATION;
    this.events.push({ type: 'powerActivated', power, targets });

    const factor = power === 'lightning' ? LIGHTNING_SCORE_FACTOR : BOMB_SCORE_FACTOR;
    for (const word of targets) this.clearWord(word, power as ClearCause, factor);
    return true;
  }

  /** Entrega los eventos pendientes y vacía la cola. */
  drainEvents(): GameEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  /** Ajusta el área de juego (redimensionamiento o cambio de tamaño de texto). */
  setLayout(layout: Layout, measure?: MeasureFn): void {
    const sx = layout.width / this.layout.width;
    const sy = layout.height / this.layout.height;
    this.layout = { ...layout };
    if (measure) this.measure = measure;
    for (const word of this.words) {
      word.width = this.measure(word.text, word.power);
      word.x = this.clampX(word.x * sx, word.width);
      word.y = Math.min(word.y * sy, layout.height - layout.tokenHeight - 1);
    }
  }

  /** Coloca una palabra concreta. Pensado para pruebas y depuración. */
  spawnWord(text: string, options: { power?: PowerType | null; x?: number; y?: number } = {}): WordEntity {
    const key = normalizeWord(text);
    const power = options.power ?? null;
    const width = this.measure(key, power);
    const word: WordEntity = {
      id: this.nextId++,
      text: key,
      key,
      letters: letterCount(key),
      x: this.clampX(options.x ?? FIELD_MARGIN_X, width),
      y: options.y ?? FIELD_TOP_Y,
      width,
      age: 0,
      power,
    };
    this.words.push(word);
    this.events.push({ type: 'spawn', word });
    return word;
  }

  /** Añade un poder al inventario respetando el máximo. Devuelve si cupo. */
  grantPower(power: PowerType): boolean {
    if (this.inventory[power] >= MAX_POWER_STOCK) return false;
    this.inventory[power]++;
    return true;
  }

  getHud(): HudState {
    return {
      score: this.score,
      level: this.level,
      lives: this.lives,
      streak: this.streak,
      multiplier: this.multiplier,
      inventory: { ...this.inventory },
      freezeLeft: this.freezeLeft,
      slowLeft: this.slowLeft,
      levelProgress: Math.min(1, this.levelTime / LEVEL_DURATION),
      phase: this.phase,
      countdown: this.countdownValue,
      summary: this.summary,
      lastWords: this.lastWords,
    };
  }

  getResult(): GameResult {
    return {
      score: this.score,
      level: this.level,
      wordsCleared: this.stats.wordsCleared,
      accuracy: accuracyPercent(this.stats.hits, this.stats.attempts),
      bestStreak: this.bestStreak,
      wpm: wordsPerMinute(this.stats.correctChars, this.elapsed),
      duration: this.elapsed,
      difficulty: this.difficulty,
    };
  }

  // ---------------------------------------------------------------------------

  private step(dt: number): void {
    // Entre niveles el juego descansa: no corre el tiempo de partida ni los poderes.
    if (this.phase === 'summary') return;
    if (this.phase === 'countdown') {
      this.stepCountdown(dt);
      return;
    }
    this.elapsed += dt;
    this.levelStats.time += dt;

    if (this.freezeLeft > 0) {
      this.freezeLeft = Math.max(0, this.freezeLeft - dt);
      if (this.freezeLeft === 0) this.events.push({ type: 'powerEnded', power: 'freeze' });
    }
    if (this.slowLeft > 0) {
      this.slowLeft = Math.max(0, this.slowLeft - dt);
      if (this.slowLeft === 0) this.events.push({ type: 'powerEnded', power: 'slow' });
    }

    // El factor de velocidad se acerca a su objetivo de forma gradual, sin saltos.
    const targetScale = this.slowLeft > 0 ? SLOW_FACTOR : 1;
    const maxDelta = SPEED_EASE_RATE * dt;
    this.speedScale += Math.max(-maxDelta, Math.min(maxDelta, targetScale - this.speedScale));

    this.levelTime = Math.min(LEVEL_DURATION, this.levelTime + dt);

    // La velocidad base también converge suavemente a la del nivel actual.
    const targetFall = this.params.fallTime;
    this.fallTime += (targetFall - this.fallTime) * Math.min(1, dt * 1.5);

    const distance = this.fallSpeed * dt;
    for (const word of this.words) {
      word.age += dt;
      word.y += distance;
    }

    this.checkBottom();
    if (this.over) return;

    // Agotado el tiempo del nivel no aparecen más palabras; al despejar la pantalla, termina.
    if (this.levelTime >= LEVEL_DURATION) {
      if (this.words.length === 0) this.completeLevel();
      return;
    }
    if (!this.autoSpawn) return;

    if (this.words.length === 0) this.spawnTimer = Math.min(this.spawnTimer, 0.6);
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = this.trySpawn() ? this.params.spawnInterval : 0.3;
    }
  }

  private completeLevel(): void {
    const s = this.levelStats;
    const bonus = levelBonus(this.level);
    this.score += bonus;
    this.summary = {
      level: this.level,
      wordsCleared: s.wordsCleared,
      accuracy: accuracyPercent(s.hits, s.attempts),
      bestStreak: s.bestStreak,
      points: s.points,
      bonus,
      livesLeft: this.lives,
      livesLost: s.livesLost,
      wpm: wordsPerMinute(s.correctChars, s.time),
      perfect: s.livesLost === 0 && s.attempts > 0 && s.hits === s.attempts,
    };
    this.phase = 'summary';
    this.events.push({ type: 'levelComplete', summary: this.summary });
  }

  private stepCountdown(dt: number): void {
    this.countdownLeft = Math.max(0, this.countdownLeft - dt);
    const value = this.countdownValue;
    if (value !== this.lastTick) {
      this.lastTick = value;
      this.events.push({ type: 'countdownTick', value });
    }
    if (this.countdownLeft === 0) {
      this.phase = 'playing';
      this.spawnTimer = 0.4;
      this.events.push({ type: 'levelStart', level: this.level });
    }
  }

  private checkBottom(): void {
    const limit = this.layout.height - this.layout.tokenHeight;
    const reached = this.words.filter((w) => w.y >= limit);
    if (reached.length === 0) return;
    reached.sort((a, b) => b.y - a.y);
    for (const word of reached) {
      this.removeWord(word);
      if (word.power) {
        // Las palabras de poder son un premio: si se escapan no cuestan vidas.
        this.events.push({ type: 'wordExpired', word });
        continue;
      }
      this.lives--;
      this.levelStats.livesLost++;
      this.streak = 0;
      this.events.push({ type: 'lifeLost', word, livesLeft: this.lives });
      if (this.lives <= 0) {
        this.lives = 0;
        this.over = true;
        this.events.push({ type: 'gameOver' });
        return;
      }
    }
  }

  private trySpawn(): boolean {
    const params = this.params;
    if (this.words.length >= params.maxWords) return false;

    const visible = new Set(this.words.map((w) => w.key));
    const entry = this.bank.pick(params, visible, this.rng);

    let power: PowerType | null = null;
    const powerOnScreen = this.words.some((w) => w.power !== null);
    if (
      !powerOnScreen &&
      this.elapsed - this.lastPowerAt >= POWER_MIN_GAP &&
      this.rng() < POWER_SPAWN_CHANCE
    ) {
      power = pickPower(this.rng());
    }

    const width = this.measure(entry.text, power);
    const x = this.findFreeX(width);
    if (x === null) return false;

    if (power) this.lastPowerAt = this.elapsed;
    const word: WordEntity = {
      id: this.nextId++,
      text: entry.text,
      key: entry.key,
      letters: entry.length,
      x,
      y: FIELD_TOP_Y,
      width,
      age: 0,
      power,
    };
    this.words.push(word);
    this.events.push({ type: 'spawn', word });
    return true;
  }

  /** Busca una posición horizontal donde la ficha nueva no tape a ninguna otra. */
  private findFreeX(width: number): number | null {
    const minX = FIELD_MARGIN_X;
    const maxX = Math.max(minX, this.layout.width - width - FIELD_MARGIN_X);
    const top = FIELD_TOP_Y;
    const bottom = top + this.layout.tokenHeight;
    const blockers = this.words.filter(
      (w) => w.y < bottom + TOKEN_GAP && w.y + this.layout.tokenHeight > top - TOKEN_GAP,
    );
    for (let attempt = 0; attempt < 16; attempt++) {
      const x = minX + this.rng() * (maxX - minX);
      const free = blockers.every(
        (w) => x + width + TOKEN_GAP <= w.x || x >= w.x + w.width + TOKEN_GAP,
      );
      if (free) return x;
    }
    return null;
  }

  private clampX(x: number, width: number): number {
    const maxX = Math.max(FIELD_MARGIN_X, this.layout.width - width - FIELD_MARGIN_X);
    return Math.min(maxX, Math.max(FIELD_MARGIN_X, x));
  }

  private clearWord(word: WordEntity, cause: ClearCause, factor: number): number {
    this.removeWord(word);
    const multiplier = this.multiplier;
    const points = wordPoints(word.letters, word.age, multiplier, factor);
    this.score += points;
    this.stats.wordsCleared++;
    this.levelStats.wordsCleared++;
    this.levelStats.points += points;
    this.events.push({ type: 'wordCleared', word, points, cause, multiplier });
    return points;
  }

  private removeWord(word: WordEntity): void {
    const index = this.words.indexOf(word);
    if (index >= 0) this.words.splice(index, 1);
  }
}

function emptyLevelStats(): LevelStats {
  return { wordsCleared: 0, attempts: 0, hits: 0, correctChars: 0, points: 0, bestStreak: 0, livesLost: 0, time: 0 };
}

function emptyStats(): EngineStats {
  return { wordsCleared: 0, wordsTyped: 0, attempts: 0, hits: 0, correctChars: 0, powersUsed: 0 };
}
