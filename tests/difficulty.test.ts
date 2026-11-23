import { describe, expect, it } from 'vitest';
import { LIMITS, paramsForLevel } from '../src/game/difficulty';

describe('dificultad progresiva', () => {
  it('los niveles 1 a 5 siguen la tabla de diseño', () => {
    expect(paramsForLevel(1)).toMatchObject({ spawnInterval: 3.0, minLen: 3, maxLen: 5 });
    expect(paramsForLevel(2)).toMatchObject({ spawnInterval: 2.7, minLen: 4, maxLen: 6 });
    expect(paramsForLevel(3)).toMatchObject({ spawnInterval: 2.4, minLen: 5, maxLen: 7 });
    expect(paramsForLevel(4)).toMatchObject({ spawnInterval: 2.1, minLen: 6, maxLen: 9 });
    expect(paramsForLevel(5)).toMatchObject({ spawnInterval: 1.8, minLen: 7, maxLen: 11 });
  });

  it('cada nivel es al menos tan exigente como el anterior', () => {
    for (let level = 1; level < 40; level++) {
      const a = paramsForLevel(level);
      const b = paramsForLevel(level + 1);
      expect(b.fallTime).toBeLessThanOrEqual(a.fallTime);
      expect(b.spawnInterval).toBeLessThanOrEqual(a.spawnInterval);
      expect(b.maxWords).toBeGreaterThanOrEqual(a.maxWords);
      expect(b.minLen).toBeGreaterThanOrEqual(a.minLen);
      expect(b.maxLen).toBeGreaterThanOrEqual(a.maxLen);
      expect(b.maxTier).toBeGreaterThanOrEqual(a.maxTier);
    }
  });

  it('del nivel 1 al 5 aumentan velocidad, frecuencia, cantidad y longitud', () => {
    const first = paramsForLevel(1);
    const fifth = paramsForLevel(5);
    expect(fifth.fallTime).toBeLessThan(first.fallTime);
    expect(fifth.spawnInterval).toBeLessThan(first.spawnInterval);
    expect(fifth.maxWords).toBeGreaterThan(first.maxWords);
    expect(fifth.minLen).toBeGreaterThan(first.minLen);
    expect(fifth.maxTier).toBeGreaterThan(first.maxTier);
  });

  it('sigue progresando después del nivel 5 pero con límites razonables', () => {
    expect(paramsForLevel(8).fallTime).toBeLessThan(paramsForLevel(5).fallTime);
    for (const difficulty of ['easy', 'normal', 'hard'] as const) {
      const extreme = paramsForLevel(500, difficulty);
      expect(extreme.fallTime).toBeGreaterThanOrEqual(LIMITS.minFallTime);
      expect(extreme.spawnInterval).toBeGreaterThanOrEqual(LIMITS.minSpawnInterval);
      expect(extreme.maxWords).toBeLessThanOrEqual(LIMITS.maxWords);
      expect(extreme.maxLen).toBeLessThanOrEqual(LIMITS.maxMaxLen);
      expect(extreme.minLen).toBeLessThanOrEqual(LIMITS.maxMinLen);
    }
  });

  it('la dificultad inicial cambia la velocidad y el ritmo', () => {
    const easy = paramsForLevel(1, 'easy');
    const normal = paramsForLevel(1, 'normal');
    const hard = paramsForLevel(1, 'hard');
    expect(easy.fallTime).toBeGreaterThan(normal.fallTime);
    expect(hard.fallTime).toBeLessThan(normal.fallTime);
    expect(easy.spawnInterval).toBeGreaterThan(normal.spawnInterval);
    expect(hard.spawnInterval).toBeLessThan(normal.spawnInterval);
  });

  it('trata niveles no válidos como el nivel 1', () => {
    expect(paramsForLevel(0)).toEqual(paramsForLevel(1));
    expect(paramsForLevel(-3)).toEqual(paramsForLevel(1));
  });
});
