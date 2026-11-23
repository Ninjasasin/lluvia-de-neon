import type { Difficulty } from './types';

export interface LevelParams {
  /** Segundos que tarda una palabra en recorrer el área de juego. */
  fallTime: number;
  /** Segundos entre apariciones. */
  spawnInterval: number;
  minLen: number;
  maxLen: number;
  /** Máximo de palabras simultáneas. */
  maxWords: number;
  /** Nivel máximo del diccionario permitido (1 cortas … 4 complejas). */
  maxTier: number;
}

/** Niveles 1 a 5, según la tabla de diseño. */
const BASE_LEVELS: readonly LevelParams[] = [
  { fallTime: 16, spawnInterval: 3.0, minLen: 3, maxLen: 5, maxWords: 5, maxTier: 1 },
  { fallTime: 14, spawnInterval: 2.7, minLen: 4, maxLen: 6, maxWords: 6, maxTier: 2 },
  { fallTime: 12, spawnInterval: 2.4, minLen: 5, maxLen: 7, maxWords: 7, maxTier: 2 },
  { fallTime: 10.5, spawnInterval: 2.1, minLen: 6, maxLen: 9, maxWords: 8, maxTier: 3 },
  { fallTime: 9, spawnInterval: 1.8, minLen: 7, maxLen: 11, maxWords: 9, maxTier: 4 },
];

/** Límites que mantienen el juego jugable en niveles altos. */
export const LIMITS = {
  minFallTime: 5.5,
  minSpawnInterval: 1.0,
  maxWords: 12,
  maxMinLen: 9,
  maxMaxLen: 14,
} as const;

const DIFFICULTY_MODS: Record<Difficulty, { speed: number; spawn: number }> = {
  easy: { speed: 0.8, spawn: 1.2 },
  normal: { speed: 1, spawn: 1 },
  hard: { speed: 1.25, spawn: 0.85 },
};

/** Parámetros de un nivel (1 en adelante) para la dificultad elegida. */
export function paramsForLevel(level: number, difficulty: Difficulty = 'normal'): LevelParams {
  const n = Math.max(1, Math.floor(level));
  let base: LevelParams;
  if (n <= BASE_LEVELS.length) {
    base = BASE_LEVELS[n - 1];
  } else {
    const last = BASE_LEVELS[BASE_LEVELS.length - 1];
    const extra = n - BASE_LEVELS.length;
    base = {
      fallTime: last.fallTime * Math.pow(0.95, extra),
      spawnInterval: last.spawnInterval - 0.1 * extra,
      minLen: Math.min(LIMITS.maxMinLen, last.minLen + Math.floor(extra / 3)),
      maxLen: Math.min(LIMITS.maxMaxLen, last.maxLen + Math.floor(extra / 2)),
      maxWords: Math.min(LIMITS.maxWords, last.maxWords + Math.floor(extra / 2)),
      maxTier: 4,
    };
  }
  const mod = DIFFICULTY_MODS[difficulty];
  return {
    ...base,
    fallTime: Math.max(LIMITS.minFallTime, base.fallTime / mod.speed),
    spawnInterval: Math.max(LIMITS.minSpawnInterval, base.spawnInterval * mod.spawn),
  };
}
