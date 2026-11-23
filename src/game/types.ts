export type PowerType = 'freeze' | 'slow' | 'lightning' | 'bomb';

export const POWER_TYPES: readonly PowerType[] = ['freeze', 'slow', 'lightning', 'bomb'];

export type Difficulty = 'easy' | 'normal' | 'hard';

export type Inventory = Record<PowerType, number>;

/** Una palabra activa en pantalla. Las coordenadas son la esquina superior izquierda de su ficha. */
export interface WordEntity {
  id: number;
  /** Texto tal como se muestra. */
  text: string;
  /** Texto normalizado para comparar con lo que escribe el jugador. */
  key: string;
  letters: number;
  x: number;
  y: number;
  width: number;
  /** Segundos de juego transcurridos desde que apareció. */
  age: number;
  /** Poder que otorga al escribirla, o null si es una palabra normal. */
  power: PowerType | null;
}

/** Área de juego en píxeles lógicos. `height` es la posición de la línea de peligro. */
export interface Layout {
  width: number;
  height: number;
  tokenHeight: number;
}

/** Devuelve el ancho de la ficha de una palabra. La provee el renderizador. */
export type MeasureFn = (text: string, power: PowerType | null) => number;

export type ClearCause = 'typed' | 'lightning' | 'bomb';

/**
 * Fase de la partida: jugando, mostrando el resumen del nivel superado
 * (espera a que el jugador continúe) o en la cuenta regresiva previa al siguiente nivel.
 */
export type GamePhase = 'playing' | 'summary' | 'countdown';

/** Resumen de un nivel superado. */
export interface LevelSummary {
  level: number;
  wordsCleared: number;
  /** Porcentaje de intentos acertados durante el nivel (0–100). */
  accuracy: number;
  bestStreak: number;
  /** Puntos ganados en el nivel, sin contar la bonificación. */
  points: number;
  bonus: number;
  livesLeft: number;
  livesLost: number;
  wpm: number;
  /** Sin vidas perdidas ni errores de escritura. */
  perfect: boolean;
}

export type GameEvent =
  | { type: 'spawn'; word: WordEntity }
  | { type: 'wordCleared'; word: WordEntity; points: number; cause: ClearCause; multiplier: number }
  | { type: 'powerGained'; power: PowerType; word: WordEntity; stored: boolean }
  | { type: 'miss'; text: string }
  | { type: 'lifeLost'; word: WordEntity; livesLeft: number }
  | { type: 'wordExpired'; word: WordEntity }
  | { type: 'levelComplete'; summary: LevelSummary }
  | { type: 'countdownTick'; value: number }
  | { type: 'levelStart'; level: number }
  | { type: 'powerActivated'; power: PowerType; targets: WordEntity[] }
  | { type: 'powerDenied'; power: PowerType; reason: 'empty' | 'noTargets' }
  | { type: 'powerEnded'; power: PowerType }
  | { type: 'gameOver' };

export type SubmitResult =
  | { kind: 'empty' }
  | { kind: 'miss' }
  | { kind: 'hit'; points: number; word: WordEntity };

/** Datos que necesita la interfaz superior y el panel de poderes. */
export interface HudState {
  score: number;
  level: number;
  lives: number;
  streak: number;
  multiplier: number;
  inventory: Inventory;
  freezeLeft: number;
  slowLeft: number;
  /** Progreso del nivel actual, de 0 a 1. */
  levelProgress: number;
  phase: GamePhase;
  /** Número visible de la cuenta regresiva (5 … 0); solo tiene sentido en esa fase. */
  countdown: number;
  /** Resumen del nivel recién superado, mientras se muestra. */
  summary: LevelSummary | null;
  /** El nivel ya no genera palabras: solo falta despejar las que quedan. */
  lastWords: boolean;
}

/** Resumen final de una partida. */
export interface GameResult {
  score: number;
  level: number;
  wordsCleared: number;
  /** Porcentaje de intentos acertados (0–100). */
  accuracy: number;
  bestStreak: number;
  wpm: number;
  /** Segundos jugados. */
  duration: number;
  difficulty: Difficulty;
}
