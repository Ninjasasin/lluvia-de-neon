import { useEffect, useRef, useState } from 'react';
import { rankProgress } from '../game/ranks';
import { DEFAULT_NAME, MAX_NAME_LENGTH, cleanName, finalName } from '../game/storage';
import type { GameResult } from '../game/types';
import { NeonButton } from './controls';
import { formatNumber } from './format';

interface PauseProps {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
}

export function PauseOverlay({ onResume, onRestart, onMenu }: PauseProps) {
  return (
    <div
      className="anim-fade absolute inset-0 z-20 flex overflow-y-auto bg-navy-deep/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Partida en pausa"
    >
      <div className="neon-panel anim-pop m-auto flex w-full max-w-sm flex-col gap-3 rounded-3xl p-6 text-center sm:p-8">
        <h2 className="neon-title mb-1 text-5xl font-black">Pausa</h2>
        <p className="mb-3 text-base text-white/70">
          El tiempo y los poderes están detenidos. Pulsa <b className="text-electric">Esc</b> para continuar.
        </p>
        <NeonButton variant="primary" onClick={onResume}>
          Continuar
        </NeonButton>
        <NeonButton onClick={onRestart}>Reiniciar</NeonButton>
        <NeonButton onClick={onMenu}>Volver al menú</NeonButton>
      </div>
    </div>
  );
}

interface GameOverProps {
  result: GameResult;
  isRecord: boolean;
  /** Mejor puntuación guardada, incluida esta partida. */
  bestScore: number;
  /** Puesto en la tabla de este navegador, o null si la partida no entró. */
  position: number | null;
  initialName: string;
  onRename: (name: string) => void;
  onRestart: () => void;
  onMenu: () => void;
}

interface NameEntryProps {
  position: number;
  initialName: string;
  onRename: (name: string) => void;
}

/** Campo para firmar la puntuación, como en las máquinas de arcade. Se guarda mientras se escribe. */
function NameEntry({ position, initialName, onRename }: NameEntryProps) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }, []);

  const commit = (raw: string) => {
    const clean = cleanName(raw);
    setName(clean);
    onRename(clean);
  };

  return (
    <div className="mt-3 rounded-2xl border-2 border-electric/60 bg-electric/10 px-3 py-2.5">
      <label htmlFor="nombre-record" className="block text-sm font-bold text-electric">
        ¡Entraste a la tabla! Puesto n.º {position}. Escribe tu nombre:
      </label>
      <input
        id="nombre-record"
        ref={inputRef}
        type="text"
        value={name}
        maxLength={MAX_NAME_LENGTH * 2}
        placeholder={DEFAULT_NAME}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={(event) => {
          const composing = (event.nativeEvent as InputEvent).isComposing;
          if (composing) setName(event.target.value);
          else commit(event.target.value);
        }}
        onCompositionEnd={(event) => commit(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
          event.preventDefault();
          event.currentTarget.blur();
        }}
        className="mt-1.5 w-full rounded-xl border-2 border-electric bg-navy-deep/90 px-3 py-1 text-center text-2xl font-black tracking-[0.25em] text-white uppercase caret-electric outline-none placeholder:text-white/25 focus:shadow-[0_0_18px_rgba(0,217,255,0.55)]"
      />
      <p className="mt-1 text-xs text-white/65">
        Guardado como <b className="text-white">{finalName(name)}</b> · hasta {MAX_NAME_LENGTH} caracteres
      </p>
    </div>
  );
}

function Stat({ label, value, title }: { label: string; value: string; title: string }) {
  return (
    <div className="rounded-xl border border-electric/30 bg-navy-deep/70 px-2 py-1.5 text-center" title={title}>
      <dt className="truncate text-xs font-semibold text-white/65">{label}</dt>
      <dd className="text-lg leading-tight font-extrabold tabular-nums sm:text-xl">{value}</dd>
    </div>
  );
}

/** Rango obtenido con la puntuación de la partida y cuánto falta para el siguiente. */
function RankBadge({ score }: { score: number }) {
  const { rank, next, pointsToNext, progress } = rankProgress(score);
  return (
    <div className="mt-3 rounded-2xl border-2 border-sun/60 bg-sun/10 px-3 py-2.5 text-left shadow-[0_0_18px_rgba(255,213,74,0.2)]">
      <div className="flex items-center gap-3">
        <span className="anim-rank shrink-0 text-5xl leading-none" aria-hidden="true">
          {rank.emoji}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.25em] text-white/65 uppercase">Tu rango</p>
          <p className="text-2xl leading-tight font-black text-sun">
            Eres {rank.article} {rank.name}
          </p>
          <p className="mt-0.5 text-sm leading-snug text-white/85">{rank.phrase}</p>
        </div>
      </div>
      <div className="mt-2">
        <div
          className="h-2 overflow-hidden rounded-full bg-navy-deep/80"
          role="progressbar"
          aria-label="Avance hacia el siguiente rango"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <div className="h-full rounded-full bg-sun" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <p className="mt-1 text-xs font-semibold text-white/70">
          {next ? (
            <>
              Te faltan <b className="text-white">{formatNumber(pointsToNext)}</b> puntos para ser {next.article}{' '}
              <b className="text-white">
                {next.name} {next.emoji}
              </b>
            </>
          ) : (
            'Llegaste a lo más alto de la escala. Más allá no hay nada.'
          )}
        </p>
      </div>
    </div>
  );
}

export function GameOverOverlay({
  result,
  isRecord,
  bestScore,
  position,
  initialName,
  onRename,
  onRestart,
  onMenu,
}: GameOverProps) {
  return (
    <div
      className="anim-fade absolute inset-0 z-20 flex overflow-y-auto bg-navy-deep/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Fin de la partida"
    >
      <div className="neon-panel anim-pop m-auto w-full max-w-xl rounded-3xl p-4 text-center sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <h2 className="text-3xl font-black text-neon-red [text-shadow:0_0_18px_rgba(255,56,92,0.8)]">
            Fin de la partida
          </h2>
          {isRecord && (
            <p className="anim-glow rounded-full border-2 border-sun bg-sun/15 px-3 py-0.5 text-sm font-extrabold whitespace-nowrap text-sun">
              ¡Nuevo récord!
            </p>
          )}
        </div>

        <p className="mt-2 text-xs font-bold tracking-[0.3em] text-electric uppercase">Puntuación final</p>
        <p className="neon-title text-5xl leading-none font-black tabular-nums">{formatNumber(result.score)}</p>

        {position !== null && <NameEntry position={position} initialName={initialName} onRename={onRename} />}

        <RankBadge score={result.score} />

        <dl className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          <Stat label="Nivel" title="Nivel alcanzado" value={String(result.level)} />
          <Stat label="Palabras" title="Palabras eliminadas" value={String(result.wordsCleared)} />
          <Stat label="Precisión" title="Precisión de escritura" value={`${result.accuracy} %`} />
          <Stat label="Racha" title="Mejor racha de aciertos" value={String(result.bestStreak)} />
          <Stat label="Por minuto" title="Palabras por minuto" value={String(result.wpm)} />
          <Stat label="Récord" title="Récord personal" value={formatNumber(bestScore)} />
        </dl>

        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <NeonButton variant="primary" onClick={onRestart}>
            Volver a jugar
          </NeonButton>
          <NeonButton onClick={onMenu}>Menú principal</NeonButton>
        </div>
      </div>
    </div>
  );
}
