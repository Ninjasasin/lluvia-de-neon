/** Multiplicadores por racha de aciertos consecutivos, de mayor a menor. */
export const STREAK_TIERS: readonly { min: number; multiplier: number }[] = [
  { min: 30, multiplier: 3 },
  { min: 20, multiplier: 2 },
  { min: 10, multiplier: 1.5 },
  { min: 5, multiplier: 1.2 },
];

/** Multiplicador que corresponde a una racha. El acierto número 5 ya puntúa con x1,2. */
export function multiplierForStreak(streak: number): number {
  for (const tier of STREAK_TIERS) {
    if (streak >= tier.min) return tier.multiplier;
  }
  return 1;
}

/**
 * Bonus por responder rápido. Vale hasta 5 puntos por letra y decae linealmente
 * hasta cero cuando la palabra lleva `3 + 0,8 × letras` segundos en pantalla.
 */
export function speedBonus(letters: number, ageSeconds: number): number {
  const window = 3 + letters * 0.8;
  const remaining = Math.min(1, Math.max(0, 1 - ageSeconds / window));
  return Math.round(letters * 5 * remaining);
}

/** Puntos = (10 × letras + bonus de velocidad) × multiplicador × factor. */
export function wordPoints(
  letters: number,
  ageSeconds: number,
  multiplier: number,
  factor = 1,
): number {
  return Math.round((10 * letters + speedBonus(letters, ageSeconds)) * multiplier * factor);
}

/** Bonificación al completar un nivel. */
export function levelBonus(levelCompleted: number): number {
  return 100 * levelCompleted;
}

/** Porcentaje de intentos acertados. */
export function accuracyPercent(hits: number, attempts: number): number {
  if (attempts <= 0) return 0;
  return Math.round((hits / attempts) * 100);
}

/** Palabras por minuto con la convención estándar: 5 caracteres correctos = 1 palabra. */
export function wordsPerMinute(correctChars: number, seconds: number): number {
  if (seconds < 1) return 0;
  return Math.round(correctChars / 5 / (seconds / 60));
}
