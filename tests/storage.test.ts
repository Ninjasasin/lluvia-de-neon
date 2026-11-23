import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, GameStorage, MAX_SCORES, type KeyValueStore } from '../src/game/storage';
import type { GameResult } from '../src/game/types';

/** Imita LocalStorage: solo guarda cadenas de texto. */
class MemoryStore implements KeyValueStore {
  readonly data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, String(value));
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

function result(score: number): GameResult {
  return {
    score,
    level: 3,
    wordsCleared: 42,
    accuracy: 91,
    bestStreak: 17,
    wpm: 38,
    duration: 150,
    difficulty: 'normal',
  };
}

describe('récords', () => {
  it('sobreviven a cerrar y volver a abrir el juego', () => {
    const disk = new MemoryStore();
    const firstSession = new GameStorage(disk);
    firstSession.addScore(result(1200));
    firstSession.addScore(result(3400));

    // Una instancia nueva equivale a recargar la página: solo comparte el almacenamiento.
    const secondSession = new GameStorage(disk);
    expect(secondSession.bestScore()).toBe(3400);
    expect(secondSession.loadScores().map((s) => s.score)).toEqual([3400, 1200]);
    expect(secondSession.loadScores()[0]).toMatchObject({ level: 3, wordsCleared: 42, accuracy: 91 });
  });

  it('detecta un nuevo récord personal', () => {
    const storage = new GameStorage(new MemoryStore());
    expect(storage.addScore(result(500))).toMatchObject({ isRecord: true, rank: 1, previousBest: 0 });
    expect(storage.addScore(result(300))).toMatchObject({ isRecord: false, rank: 2, previousBest: 500 });
    expect(storage.addScore(result(500))).toMatchObject({ isRecord: false });
    expect(storage.addScore(result(900))).toMatchObject({ isRecord: true, rank: 1, previousBest: 500 });
  });

  it('conserva solo las diez mejores, ordenadas', () => {
    const storage = new GameStorage(new MemoryStore());
    for (let i = 1; i <= 15; i++) storage.addScore(result(i * 100));
    const scores = storage.loadScores().map((s) => s.score);
    expect(scores).toHaveLength(MAX_SCORES);
    expect(scores[0]).toBe(1500);
    expect(scores[scores.length - 1]).toBe(600);
    expect(storage.addScore(result(50)).rank).toBeNull();
  });

  it('no guarda partidas sin puntos', () => {
    const storage = new GameStorage(new MemoryStore());
    expect(storage.addScore(result(0))).toMatchObject({ isRecord: false, rank: null });
    expect(storage.loadScores()).toHaveLength(0);
  });

  it('permite borrar la tabla', () => {
    const storage = new GameStorage(new MemoryStore());
    storage.addScore(result(700));
    storage.clearScores();
    expect(storage.loadScores()).toEqual([]);
    expect(storage.bestScore()).toBe(0);
  });
});

describe('configuración', () => {
  it('se guarda y se recupera', () => {
    const disk = new MemoryStore();
    new GameStorage(disk).saveSettings({
      musicVolume: 0.2,
      sfxVolume: 0,
      effects: 'reduced',
      textSize: 'large',
      difficulty: 'hard',
      background: 'ocean',
    });
    expect(new GameStorage(disk).loadSettings()).toEqual({
      musicVolume: 0.2,
      sfxVolume: 0,
      effects: 'reduced',
      textSize: 'large',
      difficulty: 'hard',
      background: 'ocean',
    });
  });

  it('usa valores por defecto si no hay nada guardado o los datos están dañados', () => {
    const disk = new MemoryStore();
    const storage = new GameStorage(disk);
    expect(storage.loadSettings()).toEqual(DEFAULT_SETTINGS);
    for (const key of [...disk.data.keys()]) disk.data.delete(key);
    storage.saveSettings(DEFAULT_SETTINGS);
    const key = [...disk.data.keys()][0];
    disk.setItem(key, '{esto no es JSON');
    expect(storage.loadSettings()).toEqual(DEFAULT_SETTINGS);
    disk.setItem(key, JSON.stringify({ musicVolume: 7, effects: 'explosivo', difficulty: 'hard', background: 'luna' }));
    expect(storage.loadSettings()).toEqual({ ...DEFAULT_SETTINGS, musicVolume: 1, difficulty: 'hard' });
  });

  it('funciona sin almacenamiento disponible', () => {
    const storage = new GameStorage(null);
    expect(storage.loadSettings()).toEqual(DEFAULT_SETTINGS);
    expect(() => storage.saveSettings(DEFAULT_SETTINGS)).not.toThrow();
    expect(storage.addScore(result(100)).isRecord).toBe(true);
    expect(storage.loadScores()).toEqual([]);
  });

  it('tolera un almacenamiento que falla al escribir', () => {
    const broken: KeyValueStore = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('sin espacio');
      },
      removeItem: () => {
        throw new Error('bloqueado');
      },
    };
    const storage = new GameStorage(broken);
    expect(storage.loadScores()).toEqual([]);
    expect(() => storage.addScore(result(100))).not.toThrow();
    expect(() => storage.clearScores()).not.toThrow();
  });
});
