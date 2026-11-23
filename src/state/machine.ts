/** Pantallas del juego: los estados de la máquina. */
export type Screen = 'menu' | 'howto' | 'settings' | 'scores' | 'playing' | 'paused' | 'gameover';

export type ScreenAction =
  | 'PLAY'
  | 'HOWTO'
  | 'SETTINGS'
  | 'SCORES'
  | 'BACK'
  | 'PAUSE'
  | 'RESUME'
  | 'RESTART'
  | 'GAME_OVER'
  | 'MENU';

/** Tabla de transiciones permitidas. Lo que no aparece aquí se ignora. */
const TRANSITIONS: Record<Screen, Partial<Record<ScreenAction, Screen>>> = {
  menu: { PLAY: 'playing', HOWTO: 'howto', SETTINGS: 'settings', SCORES: 'scores' },
  howto: { BACK: 'menu', PLAY: 'playing' },
  settings: { BACK: 'menu' },
  scores: { BACK: 'menu' },
  playing: { PAUSE: 'paused', GAME_OVER: 'gameover' },
  paused: { RESUME: 'playing', RESTART: 'playing', MENU: 'menu' },
  gameover: { RESTART: 'playing', MENU: 'menu' },
};

export function canTransition(screen: Screen, action: ScreenAction): boolean {
  return TRANSITIONS[screen][action] !== undefined;
}

/** Devuelve la pantalla siguiente; si la acción no es válida, la misma. */
export function transition(screen: Screen, action: ScreenAction): Screen {
  return TRANSITIONS[screen][action] ?? screen;
}

/** Indica si la transición comienza una partida nueva (desde cero). */
export function startsNewRun(screen: Screen, action: ScreenAction): boolean {
  return canTransition(screen, action) && (action === 'PLAY' || action === 'RESTART');
}
