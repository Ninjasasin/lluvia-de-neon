import { describe, expect, it } from 'vitest';
import { COUNTDOWN_GO_HOLD, COUNTDOWN_SECONDS, INITIAL_LIVES, LEVEL_DURATION } from '../src/game/constants';
import { paramsForLevel } from '../src/game/difficulty';
import type { GameEngine } from '../src/game/engine';
import { levelBonus } from '../src/game/scoring';
import type { GameEvent } from '../src/game/types';
import { BOTTOM_Y, createEngine, quietEngine, waitFrozen } from './helpers';

/** Juega un nivel entero sin palabras en pantalla y lo deja en la fase de resumen. */
function finishLevel(engine: GameEngine): void {
  engine.update(LEVEL_DURATION + 0.1);
}

function ofType<T extends GameEvent['type']>(events: GameEvent[], type: T) {
  return events.filter((e): e is Extract<GameEvent, { type: T }> => e.type === type);
}

describe('fin de etapa', () => {
  it('al agotarse el tiempo del nivel dejan de aparecer palabras', () => {
    const engine = createEngine({ seed: 4 });
    engine.freezeLeft = 1e6; // nada cae: las palabras se quedan en pantalla
    engine.update(LEVEL_DURATION - 1);
    engine.drainEvents();
    const before = engine.words.length;
    expect(before).toBeGreaterThan(0);

    engine.update(30);
    expect(engine.words.length).toBeLessThanOrEqual(before + 1);
    const count = engine.words.length;
    engine.update(30);
    expect(engine.words).toHaveLength(count);
    expect(ofType(engine.drainEvents(), 'spawn').length).toBeLessThanOrEqual(1);
    expect(engine.getHud().lastWords).toBe(true);
  });

  it('el nivel no termina mientras queden palabras en pantalla', () => {
    const engine = quietEngine();
    engine.spawnWord('ciudad');
    waitFrozen(engine, LEVEL_DURATION + 5);
    expect(engine.phase).toBe('playing');
    expect(engine.level).toBe(1);
    expect(engine.getHud().lastWords).toBe(true);

    // Al despejar la última palabra, la etapa se cierra.
    expect(engine.submit('ciudad').kind).toBe('hit');
    engine.update(0.05);
    expect(engine.phase).toBe('summary');
    expect(engine.words).toHaveLength(0);
  });

  it('también termina si la última palabra se pierde, descontando la vida', () => {
    const engine = quietEngine();
    waitFrozen(engine, LEVEL_DURATION - 0.5);
    engine.spawnWord('mesa', { y: BOTTOM_Y - 2 });
    engine.update(1);
    expect(engine.lives).toBe(INITIAL_LIVES - 1);
    expect(engine.phase).toBe('summary');
    expect(engine.summary).toMatchObject({ livesLost: 1, livesLeft: INITIAL_LIVES - 1, perfect: false });
  });

  it('si se pierde la última vida gana el fin de partida, no el resumen', () => {
    const engine = quietEngine();
    engine.lives = 1;
    waitFrozen(engine, LEVEL_DURATION - 0.5);
    engine.spawnWord('mesa', { y: BOTTOM_Y - 2 });
    engine.update(1);
    expect(engine.over).toBe(true);
    expect(engine.phase).toBe('playing');
    expect(engine.summary).toBeNull();
  });
});

describe('resumen del nivel', () => {
  it('recoge las estadísticas de ese nivel y entrega la bonificación', () => {
    const engine = quietEngine();
    engine.spawnWord('sol');
    engine.spawnWord('mar', { x: 200 });
    engine.spawnWord('luz', { x: 400 });
    engine.submit('sol');
    engine.submit('mar');
    engine.submit('nada');
    engine.submit('luz');
    const typedPoints = engine.score;
    engine.drainEvents();
    finishLevel(engine);

    expect(engine.phase).toBe('summary');
    expect(engine.summary).toEqual({
      level: 1,
      wordsCleared: 3,
      accuracy: 75,
      bestStreak: 2,
      points: typedPoints,
      bonus: levelBonus(1),
      livesLeft: INITIAL_LIVES,
      livesLost: 0,
      wpm: Math.round(9 / 5 / (LEVEL_DURATION / 60)),
      perfect: false,
    });
    expect(engine.score).toBe(typedPoints + levelBonus(1));
    const [event] = ofType(engine.drainEvents(), 'levelComplete');
    expect(event.summary).toEqual(engine.summary);
    expect(engine.getHud()).toMatchObject({ phase: 'summary', summary: engine.summary, lastWords: false });
  });

  it('marca el nivel como perfecto si no hubo errores ni vidas perdidas', () => {
    const engine = quietEngine();
    engine.spawnWord('gato');
    engine.submit('gato');
    finishLevel(engine);
    expect(engine.summary?.perfect).toBe(true);
  });

  it('las estadísticas empiezan de cero en cada nivel', () => {
    const engine = quietEngine();
    engine.spawnWord('gato');
    engine.submit('gato');
    engine.submit('fallo');
    finishLevel(engine);
    engine.continueToNextLevel();
    engine.update(COUNTDOWN_SECONDS + COUNTDOWN_GO_HOLD + 0.1);

    engine.spawnWord('perro');
    engine.submit('perro');
    finishLevel(engine);
    expect(engine.summary).toMatchObject({ level: 2, wordsCleared: 1, accuracy: 100, bonus: levelBonus(2) });
  });

  it('espera al jugador: el tiempo no avanza y no se puede escribir ni usar poderes', () => {
    const engine = quietEngine();
    engine.grantPower('freeze');
    finishLevel(engine);
    const elapsed = engine.elapsed;

    engine.update(120);
    expect(engine.phase).toBe('summary');
    expect(engine.level).toBe(1);
    expect(engine.elapsed).toBe(elapsed);

    engine.spawnWord('sol');
    expect(engine.submit('sol').kind).toBe('empty');
    expect(engine.activatePower('freeze')).toBe(false);
    expect(engine.inventory.freeze).toBe(1);
    expect(engine.stats.attempts).toBe(0);
  });
});

describe('cuenta regresiva', () => {
  it('solo se puede iniciar desde el resumen', () => {
    const engine = quietEngine();
    expect(engine.continueToNextLevel()).toBe(false);
    finishLevel(engine);
    expect(engine.continueToNextLevel()).toBe(true);
    expect(engine.phase).toBe('countdown');
    expect(engine.continueToNextLevel()).toBe(false);
  });

  it('cuenta de 5 a 0, un número por segundo, y luego empieza el nivel siguiente', () => {
    const engine = quietEngine();
    finishLevel(engine);
    engine.drainEvents();
    engine.continueToNextLevel();
    expect(engine.level).toBe(2);
    expect(engine.summary).toBeNull();
    expect(engine.countdownValue).toBe(5);

    const seen: number[] = [engine.countdownValue];
    for (let i = 0; i < 49; i++) {
      engine.update(0.1);
      if (engine.phase === 'countdown' && seen[seen.length - 1] !== engine.countdownValue) {
        seen.push(engine.countdownValue);
      }
    }
    expect(seen).toEqual([5, 4, 3, 2, 1]);
    expect(engine.phase).toBe('countdown');

    engine.update(0.2);
    expect(engine.countdownValue).toBe(0);
    engine.update(COUNTDOWN_GO_HOLD);
    expect(engine.phase).toBe('playing');

    const events = engine.drainEvents();
    expect(ofType(events, 'countdownTick').map((e) => e.value)).toEqual([5, 4, 3, 2, 1, 0]);
    expect(ofType(events, 'levelStart')).toEqual([{ type: 'levelStart', level: 2 }]);
  });

  it('durante la cuenta regresiva no aparecen palabras ni corre el tiempo de juego', () => {
    const engine = createEngine({ seed: 8 });
    while (engine.phase === 'playing') {
      engine.update(0.1);
      engine.words.length = 0;
    }
    engine.continueToNextLevel();
    const elapsed = engine.elapsed;
    engine.update(COUNTDOWN_SECONDS);
    expect(engine.phase).toBe('countdown');
    expect(engine.words).toHaveLength(0);
    expect(engine.elapsed).toBe(elapsed);
    expect(engine.levelTime).toBe(0);
  });

  it('la pausa detiene la cuenta regresiva', () => {
    const engine = quietEngine();
    finishLevel(engine);
    engine.continueToNextLevel();
    engine.update(1.5);
    const value = engine.countdownValue;
    engine.pause();
    engine.update(30);
    expect(engine.countdownValue).toBe(value);
    expect(engine.phase).toBe('countdown');
    engine.resume();
    engine.update(COUNTDOWN_SECONDS + COUNTDOWN_GO_HOLD);
    expect(engine.phase).toBe('playing');
  });

  it('tampoco se puede cerrar el resumen estando en pausa', () => {
    const engine = quietEngine();
    finishLevel(engine);
    engine.pause();
    expect(engine.continueToNextLevel()).toBe(false);
    expect(engine.phase).toBe('summary');
  });
});

describe('nivel siguiente', () => {
  it('arranca con la pantalla limpia, más difícil y conservando puntos, vidas, racha y poderes', () => {
    const engine = createEngine({ seed: 6 });
    engine.grantPower('bomb');
    engine.spawnWord('zzz', { y: BOTTOM_Y - 2 });
    engine.update(0.2); // se pierde una vida
    for (let i = 0; i < 3; i++) {
      engine.spawnWord('cielo', { x: 300, y: 100 });
      engine.submit('cielo');
    }
    while (engine.phase === 'playing') {
      engine.update(0.1);
      engine.words.length = 0;
    }
    const score = engine.score;
    engine.continueToNextLevel();
    engine.update(COUNTDOWN_SECONDS + COUNTDOWN_GO_HOLD + 0.05);

    expect(engine.phase).toBe('playing');
    expect(engine.level).toBe(2);
    expect(engine.words).toHaveLength(0);
    expect(engine.score).toBe(score);
    expect(engine.lives).toBe(INITIAL_LIVES - 1);
    expect(engine.streak).toBe(3);
    expect(engine.inventory.bomb).toBe(1);
    expect(engine.levelTime).toBeLessThan(0.1);
    expect(engine.params).toEqual(paramsForLevel(2));
    expect(engine.fallSpeed).toBeGreaterThan(600 / paramsForLevel(1).fallTime);

    // Y vuelven a aparecer palabras, ahora con las longitudes del nivel 2.
    engine.update(3);
    expect(engine.words.length).toBeGreaterThan(0);
    for (const word of engine.words) {
      expect(word.letters).toBeGreaterThanOrEqual(paramsForLevel(2).minLen);
      expect(word.letters).toBeLessThanOrEqual(paramsForLevel(2).maxLen);
    }
  });

  it('los temporizadores de poderes no corren durante el descanso', () => {
    const engine = quietEngine();
    waitFrozen(engine, LEVEL_DURATION - 1);
    engine.grantPower('slow');
    engine.activatePower('slow');
    engine.update(2); // termina el nivel con Ralentizar todavía activo
    expect(engine.phase).toBe('summary');
    const slowLeft = engine.slowLeft;
    expect(slowLeft).toBeGreaterThan(0);

    engine.update(20);
    engine.continueToNextLevel();
    engine.update(COUNTDOWN_SECONDS + COUNTDOWN_GO_HOLD + 0.05);
    expect(engine.phase).toBe('playing');
    // Solo puede haberse consumido el instante jugado tras terminar la cuenta regresiva.
    expect(slowLeft - engine.slowLeft).toBeGreaterThanOrEqual(0);
    expect(slowLeft - engine.slowLeft).toBeLessThan(0.2);
  });

  it('se pueden encadenar varios niveles seguidos', () => {
    const engine = quietEngine();
    for (let level = 1; level <= 4; level++) {
      expect(engine.level).toBe(level);
      finishLevel(engine);
      expect(engine.summary?.level).toBe(level);
      engine.continueToNextLevel();
      engine.update(COUNTDOWN_SECONDS + COUNTDOWN_GO_HOLD + 0.05);
    }
    expect(engine.level).toBe(5);
    expect(engine.score).toBe(levelBonus(1) + levelBonus(2) + levelBonus(3) + levelBonus(4));
  });

  it('reiniciar durante el descanso vuelve al nivel 1 jugando', () => {
    const engine = quietEngine();
    finishLevel(engine);
    engine.continueToNextLevel();
    engine.update(2);
    engine.reset();
    expect(engine.phase).toBe('playing');
    expect(engine.level).toBe(1);
    expect(engine.summary).toBeNull();
    expect(engine.countdownValue).toBe(0);
    expect(engine.getHud()).toMatchObject({ phase: 'playing', countdown: 0, summary: null, lastWords: false });
  });
});
