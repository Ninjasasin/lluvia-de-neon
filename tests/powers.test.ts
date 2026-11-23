import { describe, expect, it } from 'vitest';
import {
  BOMB_SCORE_FACTOR,
  FREEZE_DURATION,
  LIGHTNING_SCORE_FACTOR,
  MAX_POWER_STOCK,
  SLOW_DURATION,
  SLOW_FACTOR,
} from '../src/game/constants';
import { pickPower, powerForHotkey } from '../src/game/powers';
import { wordPoints } from '../src/game/scoring';
import { POWER_TYPES } from '../src/game/types';
import { createEngine, quietEngine, waitFrozen } from './helpers';

describe('obtención de poderes', () => {
  it('escribir una palabra de poder lo guarda en el inventario', () => {
    const engine = quietEngine();
    engine.spawnWord('cielo', { power: 'freeze' });
    engine.submit('cielo');
    expect(engine.inventory.freeze).toBe(1);
    const gained = engine.drainEvents().find((e) => e.type === 'powerGained');
    expect(gained).toMatchObject({ power: 'freeze', stored: true });
  });

  it('cada poder se almacena como máximo tres veces', () => {
    const engine = quietEngine();
    for (let i = 0; i < MAX_POWER_STOCK + 2; i++) {
      engine.spawnWord('mundo', { power: 'bomb' });
      engine.submit('mundo');
    }
    expect(engine.inventory.bomb).toBe(MAX_POWER_STOCK);
    const events = engine.drainEvents().filter((e) => e.type === 'powerGained');
    expect(events[events.length - 1]).toMatchObject({ stored: false });
  });

  it('no activa poderes que no se tienen', () => {
    const engine = quietEngine();
    engine.spawnWord('casa');
    for (const power of POWER_TYPES) {
      expect(engine.activatePower(power)).toBe(false);
    }
    expect(engine.words).toHaveLength(1);
    expect(engine.freezeLeft).toBe(0);
    expect(engine.slowLeft).toBe(0);
    expect(engine.inventory).toEqual({ freeze: 0, slow: 0, lightning: 0, bomb: 0 });
    expect(engine.drainEvents().filter((e) => e.type === 'powerDenied')).toHaveLength(4);
  });

  it('las palabras de poder aparecen con frecuencia moderada durante la partida', () => {
    const engine = createEngine({ seed: 11 });
    engine.freezeLeft = 0;
    let powers = 0;
    let spawns = 0;
    for (let i = 0; i < 6000; i++) {
      if (engine.phase === 'summary') engine.continueToNextLevel();
      engine.update(0.05);
      // Se retiran las palabras para que la partida continúe indefinidamente.
      for (const event of engine.drainEvents()) {
        if (event.type !== 'spawn') continue;
        spawns++;
        if (event.word.power) powers++;
      }
      engine.words.length = 0;
    }
    expect(powers).toBeGreaterThanOrEqual(3);
    expect(powers / spawns).toBeLessThan(0.25);
  });
});

describe('Congelar', () => {
  it('detiene por completo las palabras durante 6 segundos', () => {
    const engine = quietEngine();
    const word = engine.spawnWord('ventana');
    engine.update(1);
    const y = word.y;
    engine.grantPower('freeze');
    expect(engine.activatePower('freeze')).toBe(true);
    expect(engine.inventory.freeze).toBe(0);
    expect(engine.freezeLeft).toBe(FREEZE_DURATION);

    engine.update(FREEZE_DURATION - 0.1);
    expect(word.y).toBe(y);
    expect(engine.frozen).toBe(true);

    engine.update(0.2);
    expect(engine.frozen).toBe(false);
    engine.update(1);
    expect(word.y).toBeGreaterThan(y);
  });

  it('las palabras nuevas también quedan congeladas', () => {
    const engine = createEngine({ seed: 2 });
    engine.grantPower('freeze');
    engine.activatePower('freeze');
    engine.update(FREEZE_DURATION - 0.5);
    expect(engine.words.length).toBeGreaterThan(0);
    const positions = engine.words.map((w) => w.y);
    engine.update(0.3);
    expect(engine.words.slice(0, positions.length).map((w) => w.y)).toEqual(positions);
  });

  it('reactivarlo reinicia la duración en lugar de acumularla', () => {
    const engine = quietEngine();
    engine.grantPower('freeze');
    engine.grantPower('freeze');
    engine.activatePower('freeze');
    engine.update(2);
    engine.activatePower('freeze');
    expect(engine.freezeLeft).toBe(FREEZE_DURATION);
  });
});

describe('Ralentizar', () => {
  it('reduce la velocidad un 65 % durante 10 segundos y la restaura sin saltos', () => {
    const engine = quietEngine();
    engine.spawnWord('camino');
    engine.update(0.5);
    const normalSpeed = engine.fallSpeed;

    engine.grantPower('slow');
    expect(engine.activatePower('slow')).toBe(true);
    expect(engine.slowLeft).toBe(SLOW_DURATION);
    engine.update(2);
    expect(engine.speedScale).toBeCloseTo(SLOW_FACTOR, 5);
    expect(engine.fallSpeed).toBeCloseTo(normalSpeed * SLOW_FACTOR, 5);

    // Justo al terminar, la velocidad aún no ha vuelto de golpe a la normal.
    engine.update(SLOW_DURATION - 2 + 0.05);
    expect(engine.slowLeft).toBe(0);
    expect(engine.speedScale).toBeLessThan(0.6);

    // La recuperación es gradual: nunca hay un salto brusco entre pasos.
    let previous = engine.speedScale;
    for (let i = 0; i < 60; i++) {
      engine.update(1 / 60);
      expect(engine.speedScale - previous).toBeLessThanOrEqual(0.03);
      expect(engine.speedScale).toBeGreaterThanOrEqual(previous);
      previous = engine.speedScale;
    }
    expect(engine.speedScale).toBe(1);
  });

  it('reactivarlo no multiplica el efecto ni alarga indefinidamente la duración', () => {
    const engine = quietEngine();
    engine.grantPower('slow');
    engine.grantPower('slow');
    engine.activatePower('slow');
    engine.update(3);
    engine.activatePower('slow');
    expect(engine.slowLeft).toBe(SLOW_DURATION);
    engine.update(3);
    expect(engine.speedScale).toBeCloseTo(SLOW_FACTOR, 5);
  });
});

describe('Relámpago', () => {
  it('elimina las tres palabras más cercanas al fondo y da el 50 % de los puntos', () => {
    const engine = quietEngine();
    engine.spawnWord('sol', { y: 50 });
    engine.spawnWord('mesa', { x: 150, y: 150 });
    engine.spawnWord('perro', { x: 300, y: 250 });
    engine.spawnWord('ciudad', { x: 450, y: 350 });
    engine.spawnWord('castillo', { x: 600, y: 450 });
    waitFrozen(engine, 20); // el bonus de velocidad ya expiró: puntos = 10 × letras

    engine.grantPower('lightning');
    expect(engine.activatePower('lightning')).toBe(true);
    expect(engine.words.map((w) => w.text).sort()).toEqual(['mesa', 'sol']);
    const expected = [5, 6, 8].reduce((sum, n) => sum + wordPoints(n, 99, 1, LIGHTNING_SCORE_FACTOR), 0);
    expect(expected).toBe(25 + 30 + 40);
    expect(engine.score).toBe(expected);
    expect(engine.inventory.lightning).toBe(0);
  });

  it('no se gasta si no hay palabras que eliminar', () => {
    const engine = quietEngine();
    engine.grantPower('lightning');
    expect(engine.activatePower('lightning')).toBe(false);
    expect(engine.inventory.lightning).toBe(1);
  });
});

describe('Bomba', () => {
  it('elimina todas las palabras normales, conserva las de poder y da el 25 % de los puntos', () => {
    const engine = quietEngine();
    engine.spawnWord('gato', { y: 100 });
    engine.spawnWord('ventana', { x: 200, y: 200 });
    engine.spawnWord('guitarra', { x: 400, y: 300 });
    const special = engine.spawnWord('luna', { x: 600, y: 250, power: 'freeze' });
    waitFrozen(engine, 20);

    engine.grantPower('bomb');
    expect(engine.activatePower('bomb')).toBe(true);
    expect(engine.words).toEqual([special]);
    const expected = [4, 7, 8].reduce((sum, n) => sum + wordPoints(n, 99, 1, BOMB_SCORE_FACTOR), 0);
    expect(expected).toBe(10 + 18 + 20);
    expect(engine.score).toBe(expected);
  });

  it('usar un poder no altera la racha de aciertos', () => {
    const engine = quietEngine();
    engine.spawnWord('sol');
    engine.submit('sol');
    engine.spawnWord('mar');
    engine.grantPower('bomb');
    engine.activatePower('bomb');
    expect(engine.streak).toBe(1);
  });
});

describe('temporizadores en pausa', () => {
  it('los temporizadores de Congelar y Ralentizar se detienen durante la pausa', () => {
    const engine = quietEngine();
    engine.grantPower('freeze');
    engine.grantPower('slow');
    engine.activatePower('freeze');
    engine.activatePower('slow');
    engine.update(1);
    const freezeLeft = engine.freezeLeft;
    const slowLeft = engine.slowLeft;
    const levelTime = engine.levelTime;

    engine.pause();
    engine.update(30);
    expect(engine.freezeLeft).toBe(freezeLeft);
    expect(engine.slowLeft).toBe(slowLeft);
    expect(engine.levelTime).toBe(levelTime);
    expect(engine.activatePower('freeze')).toBe(false);

    engine.resume();
    engine.update(1);
    expect(engine.freezeLeft).toBeCloseTo(freezeLeft - 1, 5);
    expect(engine.slowLeft).toBeCloseTo(slowLeft - 1, 5);
  });
});

describe('utilidades de poderes', () => {
  it('asocia las teclas 1 a 4 con cada poder', () => {
    expect(powerForHotkey('1')).toBe('freeze');
    expect(powerForHotkey('2')).toBe('slow');
    expect(powerForHotkey('3')).toBe('lightning');
    expect(powerForHotkey('4')).toBe('bomb');
    expect(powerForHotkey('5')).toBeNull();
    expect(powerForHotkey('a')).toBeNull();
  });

  it('el sorteo de poderes cubre los cuatro tipos', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) seen.add(pickPower(i / 100));
    expect([...seen].sort()).toEqual([...POWER_TYPES].sort());
  });
});
