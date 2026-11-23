import { describe, expect, it } from 'vitest';
import { canTransition, startsNewRun, transition, type Screen, type ScreenAction } from '../src/state/machine';

describe('máquina de estados de pantallas', () => {
  it('recorre el ciclo menú → partida → pausa → partida → fin → menú', () => {
    let screen: Screen = 'menu';
    const path: ScreenAction[] = ['PLAY', 'PAUSE', 'RESUME', 'GAME_OVER', 'MENU'];
    const visited = path.map((action) => (screen = transition(screen, action)));
    expect(visited).toEqual(['playing', 'paused', 'playing', 'gameover', 'menu']);
  });

  it('abre y cierra las pantallas secundarias desde el menú', () => {
    expect(transition('menu', 'HOWTO')).toBe('howto');
    expect(transition('menu', 'SETTINGS')).toBe('settings');
    expect(transition('menu', 'SCORES')).toBe('scores');
    for (const screen of ['howto', 'settings', 'scores'] as const) {
      expect(transition(screen, 'BACK')).toBe('menu');
    }
    expect(transition('howto', 'PLAY')).toBe('playing');
  });

  it('ignora las acciones que no corresponden a la pantalla actual', () => {
    expect(transition('menu', 'PAUSE')).toBe('menu');
    expect(transition('menu', 'GAME_OVER')).toBe('menu');
    expect(transition('paused', 'PAUSE')).toBe('paused');
    expect(transition('paused', 'GAME_OVER')).toBe('paused');
    expect(transition('gameover', 'PAUSE')).toBe('gameover');
    expect(transition('gameover', 'RESUME')).toBe('gameover');
    expect(transition('playing', 'PLAY')).toBe('playing');
    expect(canTransition('settings', 'PLAY')).toBe(false);
  });

  it('desde la pausa se puede continuar, reiniciar o volver al menú', () => {
    expect(transition('paused', 'RESUME')).toBe('playing');
    expect(transition('paused', 'RESTART')).toBe('playing');
    expect(transition('paused', 'MENU')).toBe('menu');
  });

  it('solo Jugar y Reiniciar comienzan una partida nueva', () => {
    expect(startsNewRun('menu', 'PLAY')).toBe(true);
    expect(startsNewRun('howto', 'PLAY')).toBe(true);
    expect(startsNewRun('paused', 'RESTART')).toBe(true);
    expect(startsNewRun('gameover', 'RESTART')).toBe(true);
    expect(startsNewRun('paused', 'RESUME')).toBe(false);
    expect(startsNewRun('playing', 'RESTART')).toBe(false);
    expect(startsNewRun('settings', 'PLAY')).toBe(false);
  });
});
