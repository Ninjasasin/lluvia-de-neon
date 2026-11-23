import { describe, expect, it } from 'vitest';
import { INITIAL_LIVES, LEVEL_DURATION } from '../src/game/constants';
import { levelBonus } from '../src/game/scoring';
import type { GameEvent } from '../src/game/types';
import { BOTTOM_Y, LAYOUT, createEngine, quietEngine } from './helpers';

function types(events: GameEvent[]): string[] {
  return events.map((e) => e.type);
}

describe('escritura de palabras', () => {
  it('elimina una palabra escrita correctamente y suma puntos', () => {
    const engine = quietEngine();
    engine.spawnWord('gato');
    const result = engine.submit('gato');
    expect(result.kind).toBe('hit');
    expect(engine.words).toHaveLength(0);
    expect(engine.score).toBeGreaterThan(0);
    expect(types(engine.drainEvents())).toContain('wordCleared');
  });

  it('no elimina nada con una palabra incorrecta', () => {
    const engine = quietEngine();
    engine.spawnWord('gato');
    const result = engine.submit('gata');
    expect(result.kind).toBe('miss');
    expect(engine.words).toHaveLength(1);
    expect(engine.score).toBe(0);
    expect(types(engine.drainEvents())).toContain('miss');
  });

  it('exige la palabra completa: un prefijo no basta', () => {
    const engine = quietEngine();
    engine.spawnWord('castillo');
    expect(engine.submit('cast').kind).toBe('miss');
    expect(engine.words).toHaveLength(1);
  });

  it('acepta mayúsculas y minúsculas indistintamente', () => {
    const engine = quietEngine();
    engine.spawnWord('montaña');
    expect(engine.submit('MONTAÑA').kind).toBe('hit');
  });

  it('distingue tildes y eñes', () => {
    const engine = quietEngine();
    engine.spawnWord('jardín');
    engine.spawnWord('pequeño', { x: 300 });
    expect(engine.submit('jardin').kind).toBe('miss');
    expect(engine.submit('pequeno').kind).toBe('miss');
    expect(engine.submit('jardín').kind).toBe('hit');
    expect(engine.submit('pequeño').kind).toBe('hit');
  });

  it('acepta tildes escritas como caracteres combinados (NFD)', () => {
    const engine = quietEngine();
    engine.spawnWord('teléfono');
    expect(engine.submit('teléfono').kind).toBe('hit');
  });

  it('ignora un Enter con el campo vacío sin penalizar', () => {
    const engine = quietEngine();
    engine.spawnWord('sol');
    engine.submit('sol');
    expect(engine.submit('   ').kind).toBe('empty');
    expect(engine.streak).toBe(1);
    expect(engine.stats.attempts).toBe(1);
  });

  it('con dos palabras idénticas elimina la más cercana al fondo', () => {
    const engine = quietEngine();
    const upper = engine.spawnWord('luna', { y: 50 });
    const lower = engine.spawnWord('luna', { x: 300, y: 400 });
    const result = engine.submit('luna');
    expect(result.kind === 'hit' && result.word.id).toBe(lower.id);
    expect(engine.words.map((w) => w.id)).toEqual([upper.id]);
  });
});

describe('vidas y fin de partida', () => {
  it('una palabra que llega al fondo resta exactamente una vida', () => {
    const engine = quietEngine();
    engine.spawnWord('mesa', { y: BOTTOM_Y - 5 });
    engine.update(1);
    expect(engine.lives).toBe(INITIAL_LIVES - 1);
    expect(engine.words).toHaveLength(0);
    engine.update(3);
    expect(engine.lives).toBe(INITIAL_LIVES - 1);
    expect(engine.drainEvents().filter((e) => e.type === 'lifeLost')).toHaveLength(1);
  });

  it('la partida termina al perder las tres vidas', () => {
    const engine = quietEngine();
    for (let i = 0; i < INITIAL_LIVES; i++) {
      expect(engine.over).toBe(false);
      engine.spawnWord('casa', { y: BOTTOM_Y - 2 });
      engine.update(0.5);
    }
    expect(engine.lives).toBe(0);
    expect(engine.over).toBe(true);
    expect(types(engine.drainEvents())).toContain('gameOver');

    // Tras el final no se aceptan más acciones.
    engine.spawnWord('sol');
    expect(engine.submit('sol').kind).toBe('empty');
    const elapsed = engine.elapsed;
    engine.update(5);
    expect(engine.elapsed).toBe(elapsed);
  });

  it('una palabra de poder que se escapa no cuesta vidas', () => {
    const engine = quietEngine();
    engine.spawnWord('cielo', { power: 'bomb', y: BOTTOM_Y - 2 });
    engine.update(0.5);
    expect(engine.lives).toBe(INITIAL_LIVES);
    expect(types(engine.drainEvents())).toContain('wordExpired');
  });

  it('una partida sin jugador termina sola y nunca baja de cero vidas', () => {
    const engine = createEngine();
    for (let i = 0; i < 600 && !engine.over; i++) engine.update(0.25);
    expect(engine.over).toBe(true);
    expect(engine.lives).toBe(0);
  });
});

describe('movimiento', () => {
  it('es independiente de la tasa de cuadros', () => {
    const a = quietEngine();
    const b = quietEngine();
    const wa = a.spawnWord('perro');
    const wb = b.spawnWord('perro');
    for (let i = 0; i < 120; i++) a.update(1 / 60);
    for (let i = 0; i < 20; i++) b.update(1 / 10);
    expect(wa.y).toBeCloseTo(wb.y, 3);
  });

  it('divide los saltos de tiempo grandes en pasos pequeños', () => {
    const a = quietEngine();
    const b = quietEngine();
    const wa = a.spawnWord('perro');
    const wb = b.spawnWord('perro');
    a.update(2);
    for (let i = 0; i < 40; i++) b.update(0.05);
    expect(wa.y).toBeCloseTo(wb.y, 6);
  });
});

describe('aparición de palabras', () => {
  it('no repite palabras visibles, no las saca de pantalla y no las superpone al aparecer', () => {
    const engine = createEngine({ seed: 7 });
    for (let i = 0; i < 2400 && !engine.over; i++) {
      engine.update(1 / 60);
      const keys = engine.words.map((w) => w.key);
      expect(new Set(keys).size).toBe(keys.length);
      for (const word of engine.words) {
        expect(word.x).toBeGreaterThanOrEqual(0);
        expect(word.x + word.width).toBeLessThanOrEqual(LAYOUT.width);
      }
      for (const event of engine.drainEvents()) {
        if (event.type !== 'spawn') continue;
        const fresh = event.word;
        for (const other of engine.words) {
          if (other === fresh) continue;
          const overlapX = fresh.x < other.x + other.width && other.x < fresh.x + fresh.width;
          const overlapY = Math.abs(fresh.y - other.y) < LAYOUT.tokenHeight;
          expect(overlapX && overlapY).toBe(false);
        }
      }
    }
  });

  it('respeta el máximo de palabras simultáneas del nivel', () => {
    const engine = createEngine({ seed: 3 });
    engine.freezeLeft = 1e6; // congelado: nada cae, así que la pantalla se llena
    for (let i = 0; i < 1200; i++) {
      engine.update(0.05);
      expect(engine.words.length).toBeLessThanOrEqual(engine.params.maxWords);
    }
    expect(engine.words.length).toBeGreaterThan(1);
  });

  it('ajusta las palabras al redimensionar el área', () => {
    const engine = quietEngine();
    const word = engine.spawnWord('biblioteca', { x: 700, y: 300 });
    engine.setLayout({ width: 450, height: 300, tokenHeight: 46 });
    expect(word.x + word.width).toBeLessThanOrEqual(450);
    expect(word.y).toBeCloseTo(150, 5);
  });
});

describe('niveles', () => {
  it('al cumplirse el tiempo cierra la etapa y entrega la bonificación', () => {
    const engine = quietEngine();
    engine.update(LEVEL_DURATION + 0.1);
    expect(engine.phase).toBe('summary');
    expect(engine.level).toBe(1);
    expect(engine.score).toBe(levelBonus(1));
    const events = engine.drainEvents();
    expect(events.find((e) => e.type === 'levelComplete')).toMatchObject({
      summary: { level: 1, bonus: levelBonus(1) },
    });
  });

  it('las palabras caen más rápido en niveles superiores', () => {
    const slow = quietEngine();
    const fast = quietEngine();
    fast.level = 5;
    fast.update(10); // deja que la velocidad converja a la del nivel 5
    slow.update(10);
    expect(fast.fallSpeed).toBeGreaterThan(slow.fallSpeed * 1.5);
  });
});

describe('pausa y reinicio', () => {
  it('en pausa no avanza nada', () => {
    const engine = quietEngine();
    const word = engine.spawnWord('mundo');
    engine.update(1);
    const y = word.y;
    engine.pause();
    engine.update(10);
    expect(word.y).toBe(y);
    expect(engine.submit('mundo').kind).toBe('empty');
    engine.resume();
    engine.update(1);
    expect(word.y).toBeGreaterThan(y);
  });

  it('reiniciar elimina por completo el estado anterior', () => {
    const engine = createEngine({ seed: 5 });
    engine.grantPower('freeze');
    engine.grantPower('slow');
    engine.grantPower('bomb');
    engine.activatePower('freeze');
    engine.activatePower('slow');
    for (let i = 0; i < 400; i++) engine.update(0.25);
    engine.submit('zzz');
    expect(engine.over).toBe(true);

    engine.reset();
    expect(engine.over).toBe(false);
    expect(engine.paused).toBe(false);
    expect(engine.words).toHaveLength(0);
    expect(engine.score).toBe(0);
    expect(engine.level).toBe(1);
    expect(engine.lives).toBe(INITIAL_LIVES);
    expect(engine.streak).toBe(0);
    expect(engine.bestStreak).toBe(0);
    expect(engine.elapsed).toBe(0);
    expect(engine.levelTime).toBe(0);
    expect(engine.freezeLeft).toBe(0);
    expect(engine.slowLeft).toBe(0);
    expect(engine.speedScale).toBe(1);
    expect(engine.inventory).toEqual({ freeze: 0, slow: 0, lightning: 0, bomb: 0 });
    expect(engine.stats).toEqual({
      wordsCleared: 0,
      wordsTyped: 0,
      attempts: 0,
      hits: 0,
      correctChars: 0,
      powersUsed: 0,
    });
    expect(engine.drainEvents()).toHaveLength(0);

    // Y la partida nueva funciona con normalidad.
    engine.update(2);
    expect(engine.words.length).toBeGreaterThan(0);
  });
});

describe('estadísticas finales', () => {
  it('calcula precisión, racha y palabras eliminadas', () => {
    const engine = quietEngine();
    engine.spawnWord('sol');
    engine.spawnWord('mar', { x: 200 });
    engine.spawnWord('luz', { x: 400 });
    engine.submit('sol');
    engine.submit('mar');
    engine.submit('error');
    engine.submit('luz');
    engine.update(60);
    const result = engine.getResult();
    expect(result.wordsCleared).toBe(3);
    expect(result.accuracy).toBe(75);
    expect(result.bestStreak).toBe(2);
    expect(result.wpm).toBe(Math.round(9 / 5 / (engine.elapsed / 60)));
  });
});
