/** Formato de cada archivo JSON del diccionario. */
export interface DictionaryFile {
  /** Dificultad: 1 cortas y frecuentes, 2 intermedias, 3 largas, 4 complejas. */
  nivel: number;
  nombre?: string;
  palabras: string[];
}

export interface WordEntry {
  text: string;
  key: string;
  length: number;
  tier: number;
}

export interface WordSpec {
  minLen: number;
  maxLen: number;
  maxTier: number;
}

/** Normaliza un texto para compararlo: forma NFC, sin espacios alrededor y en minúsculas. */
export function normalizeWord(text: string): string {
  return text.normalize('NFC').trim().toLocaleLowerCase('es');
}

/** Cantidad de letras, contando «ñ» y vocales con tilde como una sola. */
export function letterCount(text: string): number {
  return Array.from(text.normalize('NFC')).length;
}

const ONLY_LETTERS = /^\p{L}+$/u;
const RECENT_MEMORY = 40;

/**
 * Banco de palabras. Descarta duplicados y entradas no válidas, y evita repetir
 * las palabras visibles o las usadas recientemente.
 */
export class WordBank {
  readonly entries: readonly WordEntry[];
  private recent: string[] = [];

  constructor(files: readonly DictionaryFile[]) {
    const seen = new Set<string>();
    const entries: WordEntry[] = [];
    const ordered = [...files].sort((a, b) => a.nivel - b.nivel);
    for (const file of ordered) {
      for (const raw of file.palabras) {
        const key = normalizeWord(raw);
        if (!ONLY_LETTERS.test(key) || seen.has(key)) continue;
        seen.add(key);
        entries.push({ text: key, key, length: letterCount(key), tier: file.nivel });
      }
    }
    this.entries = entries;
  }

  get size(): number {
    return this.entries.length;
  }

  resetHistory(): void {
    this.recent = [];
  }

  /**
   * Elige una palabra que cumpla la especificación y no esté en `exclude`.
   * Si no hay candidatas, amplía el rango de longitudes poco a poco.
   */
  pick(spec: WordSpec, exclude: ReadonlySet<string>, rng: () => number): WordEntry {
    for (let widen = 0; widen <= 20; widen++) {
      const minLen = spec.minLen - widen;
      const maxLen = spec.maxLen + widen;
      const maxTier = widen > 2 ? Number.POSITIVE_INFINITY : spec.maxTier;
      const pool = this.entries.filter(
        (e) => e.length >= minLen && e.length <= maxLen && e.tier <= maxTier && !exclude.has(e.key),
      );
      if (pool.length === 0) continue;
      const fresh = pool.filter((e) => !this.recent.includes(e.key));
      const candidates = fresh.length > 0 ? fresh : pool;
      const entry = candidates[Math.min(candidates.length - 1, Math.floor(rng() * candidates.length))];
      this.recent.push(entry.key);
      if (this.recent.length > RECENT_MEMORY) this.recent.shift();
      return entry;
    }
    throw new Error('El diccionario no tiene palabras disponibles.');
  }
}
