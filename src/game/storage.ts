import { STORAGE_PREFIX } from '../config';
import { BACKGROUND_IDS, DEFAULT_BACKGROUND, type BackgroundTheme } from './backgrounds';
import type { Difficulty, GameResult } from './types';

/** Subconjunto de la API de Storage. Permite sustituir LocalStorage en las pruebas. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type EffectsLevel = 'full' | 'reduced' | 'minimal';
export type TextSize = 'small' | 'medium' | 'large';

export interface Settings {
  /** Volumen de 0 a 1. */
  musicVolume: number;
  sfxVolume: number;
  effects: EffectsLevel;
  textSize: TextSize;
  difficulty: Difficulty;
  /** Escenario que se dibuja detrás del juego y de los menús. */
  background: BackgroundTheme;
}

export const DEFAULT_SETTINGS: Settings = {
  musicVolume: 0.5,
  sfxVolume: 0.8,
  effects: 'full',
  textSize: 'medium',
  difficulty: 'normal',
  background: DEFAULT_BACKGROUND,
};

export interface ScoreEntry extends GameResult {
  /** Fecha en formato ISO. */
  date: string;
}

export interface AddScoreOutcome {
  entries: ScoreEntry[];
  /** Posición en la tabla (1 = mejor) o null si no entró. */
  rank: number | null;
  isRecord: boolean;
  previousBest: number;
}

export const MAX_SCORES = 10;

const SETTINGS_KEY = `${STORAGE_PREFIX}:config`;
const SCORES_KEY = `${STORAGE_PREFIX}:puntuaciones`;

/** LocalStorage del navegador, o null si no está disponible (modo privado, bloqueos, etc.). */
export function browserStore(): KeyValueStore | null {
  try {
    const store = window.localStorage;
    const probe = `${STORAGE_PREFIX}:prueba`;
    store.setItem(probe, '1');
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

/** Persistencia de configuración y récords. Nunca lanza errores: sin almacenamiento, usa valores por defecto. */
export class GameStorage {
  constructor(private readonly store: KeyValueStore | null) {}

  loadSettings(): Settings {
    const raw = this.read(SETTINGS_KEY);
    if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS };
    const data = raw as Partial<Record<keyof Settings, unknown>>;
    return {
      musicVolume: volume(data.musicVolume, DEFAULT_SETTINGS.musicVolume),
      sfxVolume: volume(data.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
      effects: oneOf(data.effects, ['full', 'reduced', 'minimal'], DEFAULT_SETTINGS.effects),
      textSize: oneOf(data.textSize, ['small', 'medium', 'large'], DEFAULT_SETTINGS.textSize),
      difficulty: oneOf(data.difficulty, ['easy', 'normal', 'hard'], DEFAULT_SETTINGS.difficulty),
      background: oneOf(data.background, BACKGROUND_IDS, DEFAULT_SETTINGS.background),
    };
  }

  saveSettings(settings: Settings): void {
    this.write(SETTINGS_KEY, settings);
  }

  loadScores(): ScoreEntry[] {
    const raw = this.read(SCORES_KEY);
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(isScoreEntry)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_SCORES);
  }

  bestScore(): number {
    return this.loadScores()[0]?.score ?? 0;
  }

  /** Registra una partida terminada. Es récord si supera la mejor puntuación guardada. */
  addScore(result: GameResult, date: Date = new Date()): AddScoreOutcome {
    const current = this.loadScores();
    const previousBest = current[0]?.score ?? 0;
    const entry: ScoreEntry = { ...result, date: date.toISOString() };
    if (result.score <= 0) {
      return { entries: current, rank: null, isRecord: false, previousBest };
    }
    const entries = [...current, entry].sort((a, b) => b.score - a.score).slice(0, MAX_SCORES);
    const index = entries.indexOf(entry);
    this.write(SCORES_KEY, entries);
    return {
      entries,
      rank: index >= 0 ? index + 1 : null,
      isRecord: result.score > previousBest,
      previousBest,
    };
  }

  clearScores(): void {
    try {
      this.store?.removeItem(SCORES_KEY);
    } catch {
      /* sin almacenamiento disponible */
    }
  }

  private read(key: string): unknown {
    try {
      const text = this.store?.getItem(key);
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  }

  private write(key: string, value: unknown): void {
    try {
      this.store?.setItem(key, JSON.stringify(value));
    } catch {
      /* sin espacio o sin permiso: se ignora */
    }
  }
}

function volume(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;
}

function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback;
}

function isScoreEntry(value: unknown): value is ScoreEntry {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.score === 'number' &&
    typeof v.level === 'number' &&
    typeof v.wordsCleared === 'number' &&
    typeof v.accuracy === 'number' &&
    typeof v.bestStreak === 'number' &&
    typeof v.wpm === 'number' &&
    typeof v.date === 'string'
  );
}
