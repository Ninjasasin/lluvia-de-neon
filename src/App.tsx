import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { AudioManager } from './audio/audio';
import { createWordBank } from './game/dictionary';
import { GameStorage, browserStore, type ScoreEntry, type Settings } from './game/storage';
import type { GameResult } from './game/types';
import { startsNewRun, transition, type Screen, type ScreenAction } from './state/machine';
import { SceneBackdrop } from './ui/SceneBackdrop';
import { GameScreen } from './ui/GameScreen';
import { HowToPlay } from './ui/HowToPlay';
import { MainMenu } from './ui/MainMenu';
import { GameOverOverlay, PauseOverlay } from './ui/Overlays';
import { ScoresScreen } from './ui/ScoresScreen';
import { SettingsScreen } from './ui/SettingsScreen';

interface Outcome {
  result: GameResult;
  isRecord: boolean;
  bestScore: number;
  /** Puesto en la tabla (1 = mejor) y entrada guardada; null si no entró entre las mejores. */
  position: number | null;
  entryId: string | null;
  /** Nombre propuesto: el último que se usó en este navegador. */
  initialName: string;
}

interface AppState {
  screen: Screen;
  /** Identificador de partida: cambia en cada «Jugar» o «Reiniciar» y fuerza un estado limpio. */
  runId: number;
  outcome: Outcome | null;
}

type AppAction = { type: Exclude<ScreenAction, 'GAME_OVER'> } | { type: 'GAME_OVER'; outcome: Outcome };

function reducer(state: AppState, action: AppAction): AppState {
  const screen = transition(state.screen, action.type);
  if (screen === state.screen && !startsNewRun(state.screen, action.type)) return state;
  return {
    screen,
    runId: startsNewRun(state.screen, action.type) ? state.runId + 1 : state.runId,
    outcome: action.type === 'GAME_OVER' ? action.outcome : screen === 'gameover' ? state.outcome : null,
  };
}

export default function App() {
  const storage = useMemo(() => new GameStorage(browserStore()), []);
  const audio = useMemo(() => new AudioManager(), []);
  const bank = useMemo(() => createWordBank(), []);

  const [settings, setSettings] = useState<Settings>(() => storage.loadSettings());
  const [scores, setScores] = useState<ScoreEntry[]>(() => storage.loadScores());
  const [audioReady, setAudioReady] = useState(false);
  const [state, dispatch] = useReducer(reducer, { screen: 'menu', runId: 0, outcome: null });
  const { screen } = state;
  const inGame = screen === 'playing' || screen === 'paused' || screen === 'gameover';

  // Los navegadores solo permiten audio tras un gesto del usuario.
  useEffect(() => {
    const unlock = () => {
      audio.unlock();
      setAudioReady(true);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [audio]);

  useEffect(() => () => audio.dispose(), [audio]);

  useEffect(() => {
    storage.saveSettings(settings);
    audio.setVolumes(settings.musicVolume, settings.sfxVolume);
    document.documentElement.dataset.effects = settings.effects;
  }, [settings, storage, audio]);

  // Música: suena en menús y partida, se detiene en pausa y al terminar.
  useEffect(() => {
    if (!audioReady) return;
    if (screen === 'paused') audio.pauseMusic();
    else if (screen === 'gameover') audio.stopMusic();
    else audio.startMusic();
  }, [screen, audioReady, audio]);

  // Pausa automática al perder visibilidad o foco, y pausa manual con Escape.
  useEffect(() => {
    if (screen !== 'playing' && screen !== 'paused') return;
    const pause = () => dispatch({ type: 'PAUSE' });
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.repeat) return;
      event.preventDefault();
      dispatch({ type: screen === 'playing' ? 'PAUSE' : 'RESUME' });
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', pause);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', pause);
      window.removeEventListener('keydown', onKey);
    };
  }, [screen]);

  const handleGameOver = useCallback(
    (result: GameResult) => {
      audio.stopMusic();
      const lastName = storage.loadLastName();
      const saved = storage.addScore(result, lastName);
      setScores(saved.entries);
      if (saved.isRecord) window.setTimeout(() => audio.play('record'), 500);
      dispatch({
        type: 'GAME_OVER',
        outcome: {
          result,
          isRecord: saved.isRecord,
          bestScore: Math.max(saved.previousBest, result.score),
          position: saved.rank,
          entryId: saved.entryId,
          initialName: lastName,
        },
      });
    },
    [audio, storage],
  );

  const handleRename = useCallback(
    (entryId: string, name: string) => {
      setScores(storage.renameScore(entryId, name));
      storage.saveLastName(name);
    },
    [storage],
  );

  const go = (type: Exclude<ScreenAction, 'GAME_OVER'>) => () => {
    audio.unlock();
    audio.play('click');
    dispatch({ type });
  };

  return (
    <main className="relative h-full w-full overflow-hidden bg-navy-deep font-sans text-white">
      {!inGame && <SceneBackdrop theme={settings.background} animated={settings.effects === 'full'} />}

      {screen === 'menu' && (
        <MainMenu
          bestScore={scores[0]?.score ?? 0}
          onPlay={go('PLAY')}
          onHowTo={go('HOWTO')}
          onSettings={go('SETTINGS')}
          onScores={go('SCORES')}
        />
      )}
      {screen === 'howto' && <HowToPlay onBack={go('BACK')} onPlay={go('PLAY')} />}
      {screen === 'settings' && (
        <SettingsScreen
          settings={settings}
          onChange={setSettings}
          onPreviewSfx={() => audio.play('clear')}
          onBack={go('BACK')}
        />
      )}
      {screen === 'scores' && (
        <ScoresScreen
          scores={scores}
          onClear={() => {
            storage.clearScores();
            setScores([]);
          }}
          onBack={go('BACK')}
        />
      )}

      {inGame && (
        <GameScreen
          key={state.runId}
          settings={settings}
          audio={audio}
          bank={bank}
          paused={screen === 'paused'}
          onPause={() => dispatch({ type: 'PAUSE' })}
          onGameOver={handleGameOver}
        >
          {screen === 'paused' && (
            <PauseOverlay onResume={go('RESUME')} onRestart={go('RESTART')} onMenu={go('MENU')} />
          )}
          {screen === 'gameover' && state.outcome && (
            <GameOverOverlay
              result={state.outcome.result}
              isRecord={state.outcome.isRecord}
              bestScore={state.outcome.bestScore}
              position={state.outcome.position}
              initialName={state.outcome.initialName}
              onRename={(name) => {
                const id = state.outcome?.entryId;
                if (id) handleRename(id, name);
              }}
              onRestart={go('RESTART')}
              onMenu={go('MENU')}
            />
          )}
        </GameScreen>
      )}
    </main>
  );
}
