import { GameEngine } from '../src/game/engine';
import type { Difficulty, Layout, MeasureFn } from '../src/game/types';
import { WordBank } from '../src/game/words';

export const LAYOUT: Layout = { width: 900, height: 600, tokenHeight: 46 };

/** Medición determinista: 14 px por letra, más margen e icono. */
export const measure: MeasureFn = (text, power) => Array.from(text).length * 14 + 36 + (power ? 34 : 0);

export function testBank(): WordBank {
  return new WordBank([
    { nivel: 1, palabras: ['sol', 'mar', 'luz', 'casa', 'mesa', 'gato', 'perro', 'luna', 'cielo', 'mundo'] },
    { nivel: 2, palabras: ['ventana', 'cocina', 'jardín', 'camino', 'ciudad', 'montaña', 'pequeño'] },
    { nivel: 3, palabras: ['castillo', 'guitarra', 'teléfono', 'pingüino', 'relámpago', 'biblioteca'] },
    { nivel: 4, palabras: ['arquitectura', 'murciélago', 'extraordinario', 'archipiélago'] },
  ]);
}

/** Generador pseudoaleatorio con semilla, para partidas reproducibles. */
export function seeded(seed = 1): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createEngine(
  options: { difficulty?: Difficulty; seed?: number; autoSpawn?: boolean } = {},
): GameEngine {
  return new GameEngine({
    layout: LAYOUT,
    measure,
    bank: testBank(),
    difficulty: options.difficulty ?? 'normal',
    rng: seeded(options.seed ?? 1),
    autoSpawn: options.autoSpawn,
  });
}

/**
 * Motor sin apariciones automáticas: útil para comprobar reglas concretas
 * colocando las palabras a mano con `spawnWord`.
 */
export function quietEngine(): GameEngine {
  return createEngine({ autoSpawn: false });
}

/** Posición vertical a partir de la cual una ficha toca la línea de peligro. */
export const BOTTOM_Y = LAYOUT.height - LAYOUT.tokenHeight;

/**
 * Deja pasar el tiempo con las palabras inmóviles (como si estuvieran congeladas),
 * para que envejezcan sin llegar al fondo. Limpia los eventos generados.
 */
export function waitFrozen(engine: GameEngine, seconds: number): void {
  engine.freezeLeft = seconds + 1;
  engine.update(seconds);
  engine.freezeLeft = 0;
  engine.drainEvents();
}
