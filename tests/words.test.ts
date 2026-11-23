import { describe, expect, it } from 'vitest';
import { DICTIONARY_FILES, createWordBank } from '../src/game/dictionary';
import { paramsForLevel } from '../src/game/difficulty';
import { WordBank, letterCount, normalizeWord } from '../src/game/words';
import { seeded } from './helpers';

describe('normalización', () => {
  it('ignora mayúsculas y espacios alrededor', () => {
    expect(normalizeWord('  Árbol ')).toBe('árbol');
    expect(normalizeWord('PINGÜINO')).toBe('pingüino');
    expect(normalizeWord('Ñandú')).toBe('ñandú');
  });

  it('unifica las dos formas Unicode de las tildes', () => {
    expect(normalizeWord('canción')).toBe('canción');
    expect(normalizeWord('mañana')).toBe('mañana');
  });

  it('cuenta letras con tilde y eñes como una sola', () => {
    expect(letterCount('año')).toBe(3);
    expect(letterCount('murciélago')).toBe(10);
    expect(letterCount('canción')).toBe(7);
  });
});

describe('diccionario incluido', () => {
  const bank = createWordBank();

  it('tiene los cuatro niveles de dificultad', () => {
    expect(DICTIONARY_FILES.map((f) => f.nivel).sort()).toEqual([1, 2, 3, 4]);
  });

  it('contiene al menos 1.000 palabras únicas', () => {
    expect(bank.size).toBeGreaterThanOrEqual(1000);
    expect(new Set(bank.entries.map((e) => e.key)).size).toBe(bank.size);
  });

  it('solo contiene letras en minúscula, sin espacios ni símbolos', () => {
    for (const entry of bank.entries) {
      expect(entry.text).toMatch(/^[a-záéíóúüñ]+$/);
      expect(entry.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('los archivos no traen palabras repetidas', () => {
    const all = DICTIONARY_FILES.flatMap((f) => f.palabras.map(normalizeWord));
    expect(new Set(all).size).toBe(all.length);
  });

  it('incluye palabras con tilde, diéresis y eñe', () => {
    const keys = bank.entries.map((e) => e.key);
    expect(keys.some((k) => /[áéíóú]/.test(k))).toBe(true);
    expect(keys.some((k) => k.includes('ñ'))).toBe(true);
    expect(keys.some((k) => k.includes('ü'))).toBe(true);
  });

  it('ofrece variedad suficiente para cada nivel de juego', () => {
    for (let level = 1; level <= 20; level++) {
      const spec = paramsForLevel(level);
      const pool = bank.entries.filter(
        (e) => e.length >= spec.minLen && e.length <= spec.maxLen && e.tier <= spec.maxTier,
      );
      expect(pool.length).toBeGreaterThanOrEqual(100);
    }
  });
});

describe('selección de palabras', () => {
  it('respeta la longitud y el nivel pedidos', () => {
    const bank = createWordBank();
    const rng = seeded(4);
    for (let i = 0; i < 300; i++) {
      const entry = bank.pick({ minLen: 5, maxLen: 7, maxTier: 2 }, new Set(), rng);
      expect(entry.length).toBeGreaterThanOrEqual(5);
      expect(entry.length).toBeLessThanOrEqual(7);
      expect(entry.tier).toBeLessThanOrEqual(2);
    }
  });

  it('nunca elige una palabra excluida (visible en pantalla)', () => {
    const bank = new WordBank([{ nivel: 1, palabras: ['sol', 'mar', 'luz', 'pan'] }]);
    const rng = seeded(9);
    for (let i = 0; i < 200; i++) {
      const entry = bank.pick({ minLen: 3, maxLen: 3, maxTier: 1 }, new Set(['sol', 'mar', 'luz']), rng);
      expect(entry.key).toBe('pan');
    }
  });

  it('evita repetir palabras recientes cuando hay alternativas', () => {
    const bank = createWordBank();
    const rng = seeded(6);
    const picks: string[] = [];
    for (let i = 0; i < 40; i++) picks.push(bank.pick({ minLen: 3, maxLen: 5, maxTier: 1 }, new Set(), rng).key);
    expect(new Set(picks).size).toBe(picks.length);
  });

  it('amplía la búsqueda si no hay palabras del tamaño pedido', () => {
    const bank = new WordBank([{ nivel: 1, palabras: ['sol', 'mar'] }]);
    const entry = bank.pick({ minLen: 9, maxLen: 12, maxTier: 4 }, new Set(), seeded(1));
    expect(['sol', 'mar']).toContain(entry.key);
  });

  it('descarta duplicados y entradas no válidas al cargar', () => {
    const bank = new WordBank([
      { nivel: 1, palabras: ['Sol', 'sol', 'dos palabras', 'abc123', '', 'mar'] },
      { nivel: 2, palabras: ['MAR', 'jardín'] },
    ]);
    expect(bank.entries.map((e) => e.key)).toEqual(['sol', 'mar', 'jardín']);
    expect(bank.entries.find((e) => e.key === 'mar')?.tier).toBe(1);
  });
});
