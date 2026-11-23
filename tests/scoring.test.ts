import { describe, expect, it } from 'vitest';
import {
  accuracyPercent,
  levelBonus,
  multiplierForStreak,
  speedBonus,
  wordPoints,
  wordsPerMinute,
} from '../src/game/scoring';
import { quietEngine, waitFrozen } from './helpers';

describe('multiplicador por racha', () => {
  it('sigue la tabla de rachas', () => {
    expect(multiplierForStreak(0)).toBe(1);
    expect(multiplierForStreak(4)).toBe(1);
    expect(multiplierForStreak(5)).toBe(1.2);
    expect(multiplierForStreak(9)).toBe(1.2);
    expect(multiplierForStreak(10)).toBe(1.5);
    expect(multiplierForStreak(19)).toBe(1.5);
    expect(multiplierForStreak(20)).toBe(2);
    expect(multiplierForStreak(29)).toBe(2);
    expect(multiplierForStreak(30)).toBe(3);
    expect(multiplierForStreak(250)).toBe(3);
  });
});

describe('puntos por palabra', () => {
  it('aplica la fórmula (10 × letras + bonus de velocidad) × multiplicador', () => {
    expect(wordPoints(5, 999, 1)).toBe(50);
    expect(wordPoints(5, 0, 1)).toBe(75);
    expect(wordPoints(8, 999, 1.5)).toBe(120);
    expect(wordPoints(8, 0, 2)).toBe((80 + 40) * 2);
    expect(wordPoints(10, 999, 3)).toBe(300);
  });

  it('las palabras largas valen más que las cortas', () => {
    expect(wordPoints(11, 5, 1)).toBeGreaterThan(wordPoints(4, 5, 1));
  });

  it('el bonus de velocidad decae con el tiempo y nunca es negativo', () => {
    expect(speedBonus(6, 0)).toBe(30);
    expect(speedBonus(6, 2)).toBeLessThan(speedBonus(6, 0));
    expect(speedBonus(6, 4)).toBeLessThan(speedBonus(6, 2));
    expect(speedBonus(6, 100)).toBe(0);
  });

  it('aplica el factor de los poderes', () => {
    expect(wordPoints(6, 999, 1, 0.5)).toBe(30);
    expect(wordPoints(6, 999, 2, 0.25)).toBe(30);
  });
});

describe('otras fórmulas', () => {
  it('bonificación por nivel superado', () => {
    expect(levelBonus(1)).toBe(100);
    expect(levelBonus(4)).toBe(400);
  });

  it('precisión', () => {
    expect(accuracyPercent(0, 0)).toBe(0);
    expect(accuracyPercent(3, 4)).toBe(75);
    expect(accuracyPercent(10, 10)).toBe(100);
  });

  it('palabras por minuto', () => {
    expect(wordsPerMinute(250, 60)).toBe(50);
    expect(wordsPerMinute(100, 30)).toBe(40);
    expect(wordsPerMinute(100, 0)).toBe(0);
  });
});

describe('puntuación dentro de la partida', () => {
  it('el quinto acierto consecutivo ya puntúa con x1,2', () => {
    const engine = quietEngine();
    const gained: number[] = [];
    for (let i = 0; i < 5; i++) {
      engine.spawnWord('mundo');
      waitFrozen(engine, 8); // sin bonus de velocidad: 50 puntos base
      const result = engine.submit('mundo');
      gained.push(result.kind === 'hit' ? result.points : -1);
    }
    expect(gained).toEqual([50, 50, 50, 50, 60]);
    expect(engine.multiplier).toBe(1.2);
    expect(engine.score).toBe(260);
  });

  it('alcanza x1,5, x2 y x3 en las rachas de 10, 20 y 30', () => {
    const engine = quietEngine();
    const points: number[] = [];
    for (let i = 0; i < 30; i++) {
      engine.spawnWord('casa');
      waitFrozen(engine, 7);
      const result = engine.submit('casa');
      points.push(result.kind === 'hit' ? result.points : -1);
      engine.levelTime = 0; // evita la bonificación de nivel en esta prueba
    }
    expect(points[8]).toBe(48); // racha 9 → x1,2
    expect(points[9]).toBe(60); // racha 10 → x1,5
    expect(points[19]).toBe(80); // racha 20 → x2
    expect(points[29]).toBe(120); // racha 30 → x3
  });

  it('un error de escritura rompe la racha', () => {
    const engine = quietEngine();
    for (let i = 0; i < 6; i++) {
      engine.spawnWord('luna');
      engine.submit('luna');
    }
    expect(engine.streak).toBe(6);
    expect(engine.multiplier).toBe(1.2);
    engine.spawnWord('gato');
    engine.submit('gto');
    expect(engine.streak).toBe(0);
    expect(engine.multiplier).toBe(1);
    expect(engine.bestStreak).toBe(6);
  });

  it('perder una vida también rompe la racha', () => {
    const engine = quietEngine();
    for (let i = 0; i < 5; i++) {
      engine.spawnWord('sol');
      engine.submit('sol');
    }
    engine.spawnWord('mesa', { y: 560 });
    engine.update(1);
    expect(engine.streak).toBe(0);
  });

  it('responder rápido da más puntos que responder tarde', () => {
    const fast = quietEngine();
    fast.spawnWord('guitarra');
    fast.update(0.5);
    const quick = fast.submit('guitarra');

    const slow = quietEngine();
    slow.spawnWord('guitarra');
    slow.update(8);
    const late = slow.submit('guitarra');

    expect(quick.kind === 'hit' && late.kind === 'hit' && quick.points > late.points).toBe(true);
  });
});
