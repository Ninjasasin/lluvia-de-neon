import { describe, expect, it } from 'vitest';
import { RANKS, rankForScore, rankProgress } from '../src/game/ranks';

describe('escala de rangos', () => {
  it('empieza en cero y sube en orden estrictamente creciente', () => {
    expect(RANKS[0].min).toBe(0);
    for (let i = 1; i < RANKS.length; i++) {
      expect(RANKS[i].min).toBeGreaterThan(RANKS[i - 1].min);
    }
  });

  it('tiene 35 rangos', () => {
    expect(RANKS).toHaveLength(35);
  });

  it('cada rango tiene nombre, emoji y frase propios', () => {
    expect(new Set(RANKS.map((r) => r.name)).size).toBe(RANKS.length);
    expect(new Set(RANKS.map((r) => r.emoji)).size).toBe(RANKS.length);
    expect(new Set(RANKS.map((r) => r.phrase)).size).toBe(RANKS.length);
    for (const rank of RANKS) {
      expect(rank.name.length).toBeGreaterThan(0);
      expect(rank.phrase.length).toBeGreaterThan(10);
      expect(['un', 'una']).toContain(rank.article);
    }
  });

  it('los primeros rangos siguen el orden de la evolución', () => {
    expect(RANKS.slice(0, 13).map((r) => r.name)).toEqual([
      'Ameba',
      'Esponja de mar',
      'Medusa',
      'Gusano',
      'Camarón',
      'Pez',
      'Rana',
      'Tortuga',
      'Dinosaurio',
      'Gallina',
      'Ratón',
      'Mono con teclado',
      'Troglodita',
    ]);
  });

  it('entre el troglodita y el oficinista hay escalones intermedios', () => {
    const names = RANKS.map((r) => r.name);
    expect(names.indexOf('Oficinista') - names.indexOf('Troglodita')).toBeGreaterThanOrEqual(5);
  });

  it('termina en el Big Bang', () => {
    expect(RANKS[RANKS.length - 1].name).toBe('Big Bang');
  });

  it('los saltos entre rangos nunca se achican: cada escalón cuesta al menos lo que el anterior', () => {
    for (let i = 2; i < RANKS.length; i++) {
      const step = RANKS[i].min - RANKS[i - 1].min;
      const previous = RANKS[i - 1].min - RANKS[i - 2].min;
      expect(step).toBeGreaterThanOrEqual(previous);
    }
  });
});

describe('rango según la puntuación', () => {
  it('una partida sin puntos es una ameba', () => {
    expect(rankForScore(0).name).toBe('Ameba');
    expect(rankForScore(RANKS[1].min - 1).name).toBe('Ameba');
  });

  it('el rango cambia exactamente al llegar a su mínimo', () => {
    for (let i = 1; i < RANKS.length; i++) {
      expect(rankForScore(RANKS[i].min - 1)).toBe(RANKS[i - 1]);
      expect(rankForScore(RANKS[i].min)).toBe(RANKS[i]);
    }
  });

  it('a más puntos, nunca un rango menor', () => {
    let previous = 0;
    for (let score = 0; score <= 150000; score += 137) {
      const index = RANKS.indexOf(rankForScore(score));
      expect(index).toBeGreaterThanOrEqual(previous);
      previous = index;
    }
  });

  it('las puntuaciones enormes se quedan en el rango más alto', () => {
    expect(rankForScore(10_000_000)).toBe(RANKS[RANKS.length - 1]);
  });
});

describe('avance hacia el siguiente rango', () => {
  it('indica el rango siguiente y los puntos que faltan', () => {
    const [medusa, gusano] = [RANKS[2], RANKS[3]];
    const score = medusa.min + 50;
    const info = rankProgress(score);
    expect(info.rank).toBe(medusa);
    expect(info.next).toBe(gusano);
    expect(info.pointsToNext).toBe(gusano.min - score);
    expect(info.progress).toBeCloseTo(50 / (gusano.min - medusa.min), 5);
  });

  it('al entrar en un rango el avance empieza en cero', () => {
    const info = rankProgress(RANKS[9].min);
    expect(info.rank.name).toBe('Gallina');
    expect(info.progress).toBe(0);
    expect(info.pointsToNext).toBe(RANKS[10].min - RANKS[9].min);
  });

  it('en el rango más alto no queda nada por alcanzar', () => {
    const info = rankProgress(999999);
    expect(info.next).toBeNull();
    expect(info.pointsToNext).toBe(0);
    expect(info.progress).toBe(1);
  });
});
