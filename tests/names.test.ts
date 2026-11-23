import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NAME,
  GameStorage,
  MAX_NAME_LENGTH,
  cleanName,
  finalName,
  type KeyValueStore,
} from '../src/game/storage';
import type { GameResult } from '../src/game/types';

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
    level: 2,
    wordsCleared: 20,
    accuracy: 90,
    bestStreak: 8,
    wpm: 30,
    duration: 80,
    difficulty: 'normal',
  };
}

describe('nombres de la tabla', () => {
  it('se escriben en mayúsculas, conservando tildes y eñes', () => {
    expect(cleanName('ignacio')).toBe('IGNACIO');
    expect(cleanName('Ñandú')).toBe('ÑANDÚ');
    expect(cleanName('josé 2')).toBe('JOSÉ 2');
  });

  it('descarta símbolos y espacios sobrantes', () => {
    expect(cleanName('  a<b>!? c')).toBe('AB C');
    expect(cleanName('uno    dos')).toBe('UNO DOS');
    expect(cleanName('😀ana')).toBe('ANA');
  });

  it('se limitan al largo máximo', () => {
    expect(MAX_NAME_LENGTH).toBe(10);
    expect(cleanName('abcdefghijklmnop')).toBe('ABCDEFGHIJ');
    expect(Array.from(cleanName('ñ'.repeat(30)))).toHaveLength(MAX_NAME_LENGTH);
  });

  it('mientras se escribe se permite un espacio al final, pero no al guardar', () => {
    expect(cleanName('ana ')).toBe('ANA ');
    expect(finalName('ana ')).toBe('ANA');
  });

  it('un nombre vacío se guarda como anónimo', () => {
    expect(finalName('')).toBe(DEFAULT_NAME);
    expect(finalName('   ')).toBe(DEFAULT_NAME);
    expect(finalName('!!!')).toBe(DEFAULT_NAME);
  });
});

describe('récords con nombre', () => {
  it('guarda el nombre junto a la puntuación y sobrevive a recargar', () => {
    const disk = new MemoryStore();
    new GameStorage(disk).addScore(result(900), 'nacho');
    const [entry] = new GameStorage(disk).loadScores();
    expect(entry).toMatchObject({ score: 900, name: 'NACHO' });
    expect(entry.id.length).toBeGreaterThan(0);
  });

  it('sin nombre, la partida queda como anónima', () => {
    const storage = new GameStorage(new MemoryStore());
    storage.addScore(result(500));
    storage.addScore(result(400), '');
    expect(storage.loadScores().map((s) => s.name)).toEqual([DEFAULT_NAME, DEFAULT_NAME]);
  });

  it('informa el puesto y la entrada guardada', () => {
    const storage = new GameStorage(new MemoryStore());
    storage.addScore(result(800), 'ana');
    const saved = storage.addScore(result(600), 'beto');
    expect(saved.rank).toBe(2);
    expect(saved.entryId).toBe(storage.loadScores()[1].id);
  });

  it('una partida que no entra en la tabla no tiene entrada que firmar', () => {
    const storage = new GameStorage(new MemoryStore());
    for (let i = 1; i <= 10; i++) storage.addScore(result(1000 + i), 'top');
    const saved = storage.addScore(result(5), 'tarde');
    expect(saved).toMatchObject({ rank: null, entryId: null });
    expect(storage.loadScores().some((s) => s.name === 'TARDE')).toBe(false);
  });

  it('permite cambiar el nombre de una partida sin tocar las demás', () => {
    const disk = new MemoryStore();
    const storage = new GameStorage(disk);
    const first = storage.addScore(result(800), 'ana');
    const second = storage.addScore(result(800), 'ana');
    expect(first.entryId).not.toBe(second.entryId);

    const updated = storage.renameScore(second.entryId!, 'carla');
    expect(updated.find((s) => s.id === second.entryId)?.name).toBe('CARLA');
    expect(updated.find((s) => s.id === first.entryId)?.name).toBe('ANA');
    // El cambio queda guardado.
    expect(new GameStorage(disk).loadScores().map((s) => s.name).sort()).toEqual(['ANA', 'CARLA']);
  });

  it('renombrar con un texto vacío deja la partida como anónima', () => {
    const storage = new GameStorage(new MemoryStore());
    const saved = storage.addScore(result(700), 'ana');
    expect(storage.renameScore(saved.entryId!, '')[0].name).toBe(DEFAULT_NAME);
  });

  it('renombrar una entrada inexistente no cambia nada', () => {
    const storage = new GameStorage(new MemoryStore());
    storage.addScore(result(700), 'ana');
    expect(storage.renameScore('no-existe', 'otro').map((s) => s.name)).toEqual(['ANA']);
  });

  it('las partidas guardadas antes de que hubiera nombres aparecen como anónimas', () => {
    const disk = new MemoryStore();
    const storage = new GameStorage(disk);
    storage.addScore(result(650), 'ana');
    const key = [...disk.data.keys()].find((k) => k.includes('puntuaciones'))!;
    const old = { ...result(1200), date: '2026-11-22T10:00:00.000Z' };
    disk.setItem(key, JSON.stringify([old, ...JSON.parse(disk.getItem(key)!)]));

    const scores = new GameStorage(disk).loadScores();
    expect(scores.map((s) => [s.score, s.name])).toEqual([
      [1200, DEFAULT_NAME],
      [650, 'ANA'],
    ]);
    expect(new Set(scores.map((s) => s.id)).size).toBe(2);
  });
});

describe('último nombre usado', () => {
  it('se recuerda para la siguiente partida', () => {
    const disk = new MemoryStore();
    new GameStorage(disk).saveLastName('nacho ');
    expect(new GameStorage(disk).loadLastName()).toBe('NACHO');
  });

  it('está vacío si nunca se escribió uno', () => {
    expect(new GameStorage(new MemoryStore()).loadLastName()).toBe('');
    expect(new GameStorage(null).loadLastName()).toBe('');
  });

  it('borrar la tabla no borra el nombre recordado', () => {
    const storage = new GameStorage(new MemoryStore());
    storage.saveLastName('ana');
    storage.addScore(result(300), 'ana');
    storage.clearScores();
    expect(storage.loadScores()).toEqual([]);
    expect(storage.loadLastName()).toBe('ANA');
  });
});
