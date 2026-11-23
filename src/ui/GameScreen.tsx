import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import type { AudioManager } from '../audio/audio';
import { FREEZE_DURATION, INITIAL_LIVES, SLOW_DURATION } from '../game/constants';
import { POWERS, powerForHotkey } from '../game/powers';
import { GameSession, INPUT_ZONE_HEIGHT } from '../game/session';
import type { Settings } from '../game/storage';
import type { GameResult, HudState, PowerType } from '../game/types';
import type { WordBank } from '../game/words';
import { formatSeconds } from './format';
import { Hud, keepFocus } from './Hud';
import { CountdownOverlay, LevelSummaryCard } from './LevelBreak';
import { PowerIcon } from './PowerIcon';
import { PowerPanel } from './PowerPanel';

interface Props {
  settings: Settings;
  audio: AudioManager;
  bank: WordBank;
  paused: boolean;
  onPause: () => void;
  onGameOver: (result: GameResult) => void;
  /** Superposiciones (pausa, fin de partida). */
  children?: ReactNode;
}

const INITIAL_HUD: HudState = {
  score: 0,
  level: 1,
  lives: INITIAL_LIVES,
  streak: 0,
  multiplier: 1,
  inventory: { freeze: 0, slow: 0, lightning: 0, bomb: 0 },
  freezeLeft: 0,
  slowLeft: 0,
  levelProgress: 0,
  phase: 'playing',
  countdown: 0,
  summary: null,
  lastWords: false,
};

/** Tiempo mínimo que el resumen permanece antes de aceptar Enter, por si el jugador venía tecleando. */
const SUMMARY_GUARD_MS = 700;

const MAX_TYPED = 24;

/** Solo se admiten letras (incluidas tildes, diéresis y ñ). */
function onlyLetters(value: string): string {
  return Array.from(value.normalize('NFC').replace(/[^\p{L}]/gu, ''))
    .slice(0, MAX_TYPED)
    .join('');
}

function EffectChip({ type, seconds, total }: { type: PowerType; seconds: number; total: number }) {
  const info = POWERS[type];
  return (
    <div
      className="anim-fade relative flex items-center gap-2 overflow-hidden rounded-lg border-2 bg-navy-deep/90 py-1 pr-3 pl-2 text-sm font-extrabold whitespace-nowrap"
      style={{ borderColor: info.color, color: info.color }}
    >
      <PowerIcon type={type} size={18} />
      <span>{type === 'freeze' ? 'Congelado' : 'Lento'}</span>
      <span className="text-white tabular-nums">{formatSeconds(seconds)} s</span>
      <span
        className="absolute bottom-0 left-0 h-0.5"
        style={{ width: `${Math.min(100, (seconds / total) * 100)}%`, background: info.color }}
      />
    </div>
  );
}

/** Pantalla de juego: lienzo, barra superior, panel de poderes y caja de escritura. */
export function GameScreen({ settings, audio, bank, paused, onPause, onGameOver, children }: Props) {
  const areaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<GameSession | null>(null);
  const [hud, setHud] = useState<HudState>(INITIAL_HUD);
  const [typed, setTyped] = useState('');

  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  const active = !paused && hud.lives > 0 && hud.phase === 'playing';
  const activeRef = useRef(active);
  activeRef.current = active;

  // La sesión vive lo que dura este componente: una partida.
  useEffect(() => {
    const area = areaRef.current;
    const canvas = canvasRef.current;
    if (!area || !canvas) return;
    const rect = area.getBoundingClientRect();
    const session = new GameSession({
      canvas,
      width: rect.width,
      height: rect.height,
      settings,
      audio,
      bank,
      onHud: setHud,
      onGameOver: (result) => onGameOverRef.current(result),
    });
    sessionRef.current = session;
    if (import.meta.env.DEV) (window as unknown as { __juego?: GameSession }).__juego = session;
    session.start();

    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box) session.resize(box.width, box.height);
    });
    observer.observe(area);

    return () => {
      observer.disconnect();
      session.destroy();
      sessionRef.current = null;
    };
    // La configuración no cambia durante la partida: se lee al crearla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sessionRef.current?.setPaused(paused);
  }, [paused]);

  // El teclado mantiene el foco en la caja de escritura mientras se juega.
  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const refocus = () => {
      if (activeRef.current && document.activeElement !== inputRef.current) inputRef.current?.focus();
    };
    window.addEventListener('keydown', refocus, true);
    window.addEventListener('focus', refocus);
    return () => {
      window.removeEventListener('keydown', refocus, true);
      window.removeEventListener('focus', refocus);
    };
  }, [active]);

  const typedLength = useRef(0);
  const updateTyped = useCallback(
    (value: string) => {
      const length = Array.from(value).length;
      if (length > typedLength.current) audio.play('key');
      typedLength.current = length;
      setTyped(value);
      sessionRef.current?.setTyped(value);
    },
    [audio],
  );

  const submit = useCallback(() => {
    const session = sessionRef.current;
    const input = inputRef.current;
    if (!session || !input || !activeRef.current) return;
    const result = session.submit(input.value);
    typedLength.current = 0;
    setTyped('');
    if (result.kind === 'miss') {
      const box = boxRef.current;
      if (box) {
        box.classList.remove('anim-miss');
        void box.offsetWidth;
        box.classList.add('anim-miss');
      }
    }
  }, []);

  // Al terminar el nivel se descarta lo que hubiera quedado escrito.
  const inBreak = hud.phase !== 'playing';
  useEffect(() => {
    if (!inBreak) return;
    typedLength.current = 0;
    setTyped('');
    sessionRef.current?.setTyped('');
  }, [inBreak]);

  const continueToNextLevel = useCallback(() => {
    sessionRef.current?.continueToNextLevel();
  }, []);

  // En el resumen, Enter o la barra espaciadora pasan a la cuenta regresiva.
  const showingSummary = hud.phase === 'summary' && !paused;
  useEffect(() => {
    if (!showingSummary) return;
    const shownAt = performance.now();
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (event.repeat || performance.now() - shownAt < SUMMARY_GUARD_MS) return;
      continueToNextLevel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showingSummary, continueToNextLevel]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const composing = (event.nativeEvent as InputEvent).isComposing;
    updateTyped(composing ? event.target.value : onlyLetters(event.target.value));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const power = powerForHotkey(event.key);
    if (power) {
      event.preventDefault();
      sessionRef.current?.activatePower(power);
    }
  };

  const handleAreaMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (active && event.target !== inputRef.current) event.preventDefault();
  };

  const activatePower = useCallback((power: PowerType) => {
    sessionRef.current?.activatePower(power);
  }, []);

  return (
    <div className="relative z-10 flex h-full w-full items-center justify-center p-2 sm:p-3">
      <div className="relative flex h-full max-h-[900px] w-full max-w-[1240px] min-w-[560px] flex-col overflow-hidden rounded-2xl border-2 border-electric/60 bg-navy shadow-[0_0_40px_rgba(0,217,255,0.2)]">
        <Hud hud={hud} onPause={onPause} />

        <div ref={areaRef} className="relative min-h-0 flex-1" onMouseDown={handleAreaMouseDown}>
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="Área de juego" />

          <div
            className="absolute top-0 right-2 flex items-center min-[760px]:right-3"
            style={{ bottom: INPUT_ZONE_HEIGHT }}
          >
            <PowerPanel hud={hud} disabled={!active} onActivate={activatePower} />
          </div>

          <div
            className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-3 sm:px-4"
            style={{ height: INPUT_ZONE_HEIGHT }}
          >
            <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-1.5">
              {hud.freezeLeft > 0 && <EffectChip type="freeze" seconds={hud.freezeLeft} total={FREEZE_DURATION} />}
              {hud.slowLeft > 0 && <EffectChip type="slow" seconds={hud.slowLeft} total={SLOW_DURATION} />}
            </div>

            <div
              ref={boxRef}
              className="typing-box flex h-[68px] w-[min(600px,58%)] shrink-0 items-center gap-2 rounded-2xl py-2 pr-2 pl-5"
              onAnimationEnd={(event) => event.currentTarget.classList.remove('anim-miss')}
            >
              <input
                ref={inputRef}
                type="text"
                value={typed}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onCompositionEnd={(event) => updateTyped(onlyLetters(event.currentTarget.value))}
                onPaste={(event) => event.preventDefault()}
                onDrop={(event) => event.preventDefault()}
                disabled={!active}
                aria-label="Escribe la palabra y pulsa Enter"
                placeholder={active ? 'Escribe aquí…' : hud.phase === 'countdown' ? 'Prepárate…' : ''}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="done"
                className="h-full min-w-0 flex-1 bg-transparent text-3xl font-extrabold tracking-wide text-white caret-electric outline-none placeholder:text-xl placeholder:font-semibold placeholder:text-white/30"
              />
              <button
                type="button"
                tabIndex={-1}
                disabled={!active}
                onMouseDown={keepFocus}
                onClick={submit}
                title="Confirmar la palabra"
                className="flex h-full shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border-2 border-electric bg-electric/15 px-4 text-lg font-extrabold text-electric transition hover:bg-electric/30 active:scale-95 disabled:cursor-default disabled:opacity-50"
              >
                Enter
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M19 5v8a2 2 0 0 1-2 2H6m0 0 4-4m-4 4 4 4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1" />
          </div>

          {hud.phase === 'summary' && hud.summary && (
            <LevelSummaryCard summary={hud.summary} onContinue={continueToNextLevel} />
          )}
          {hud.phase === 'countdown' && (
            <CountdownOverlay level={hud.level} value={hud.countdown} difficulty={settings.difficulty} />
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
