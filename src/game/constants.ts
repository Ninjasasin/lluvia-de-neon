export const INITIAL_LIVES = 3;

/** Segundos durante los que aparecen palabras en cada nivel. Después solo queda despejar la pantalla. */
export const LEVEL_DURATION = 50;

/** La cuenta regresiva entre niveles va de este número a cero. */
export const COUNTDOWN_SECONDS = 5;
/** Tiempo que el cero permanece visible antes de que arranque el nivel. */
export const COUNTDOWN_GO_HOLD = 0.6;

export const MAX_POWER_STOCK = 3;

export const FREEZE_DURATION = 6;
export const SLOW_DURATION = 10;
/** Ralentizar reduce la velocidad un 65 %: las palabras caen al 35 %. */
export const SLOW_FACTOR = 0.35;

export const LIGHTNING_TARGETS = 3;
export const LIGHTNING_SCORE_FACTOR = 0.5;
export const BOMB_SCORE_FACTOR = 0.25;

/** Probabilidad de que una aparición sea una palabra de poder (una vez cumplida la espera mínima). */
export const POWER_SPAWN_CHANCE = 0.14;
/** Segundos mínimos entre dos palabras de poder. */
export const POWER_MIN_GAP = 11;
/** Segundos de partida antes de la primera palabra de poder. */
export const POWER_FIRST_DELAY = 8;

/** Cambio máximo por segundo del factor de velocidad: evita saltos al entrar o salir de Ralentizar. */
export const SPEED_EASE_RATE = 1.4;

/** Paso máximo de simulación. Tiempos mayores se dividen en varios pasos. */
export const MAX_STEP = 0.05;

/** Márgenes del área donde aparecen las palabras. */
export const FIELD_MARGIN_X = 12;
export const FIELD_TOP_Y = 10;
/** Separación mínima entre fichas al aparecer. */
export const TOKEN_GAP = 12;
