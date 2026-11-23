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
  onRestart: () => void;
  onMenu: () => void;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-electric/30 bg-navy-deep/70 px-4 py-3">
      <dt className="text-sm font-semibold text-white/65">{label}</dt>
      <dd className="text-2xl font-extrabold tabular-nums">{value}</dd>
    </div>
  );
}

export function GameOverOverlay({ result, isRecord, bestScore, onRestart, onMenu }: GameOverProps) {
  return (
    <div
      className="anim-fade absolute inset-0 z-20 flex overflow-y-auto bg-navy-deep/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Fin de la partida"
    >
      <div className="neon-panel anim-pop m-auto w-full max-w-xl rounded-3xl p-5 text-center sm:p-7">
        <h2 className="text-4xl font-black text-neon-red [text-shadow:0_0_18px_rgba(255,56,92,0.8)]">
          Fin de la partida
        </h2>

        {isRecord && (
          <p className="anim-glow mx-auto mt-3 inline-block rounded-full border-2 border-sun bg-sun/15 px-5 py-1 text-lg font-extrabold text-sun">
            ¡Nuevo récord!
          </p>
        )}

        <p className="mt-4 text-sm font-bold tracking-[0.3em] text-electric uppercase">Puntuación final</p>
        <p className="neon-title text-6xl font-black tabular-nums">{formatNumber(result.score)}</p>

        <dl className="mt-5 grid grid-cols-2 gap-2.5 text-left sm:grid-cols-3">
          <Stat label="Nivel alcanzado" value={String(result.level)} />
          <Stat label="Palabras eliminadas" value={String(result.wordsCleared)} />
          <Stat label="Precisión" value={`${result.accuracy} %`} />
          <Stat label="Mejor racha" value={String(result.bestStreak)} />
          <Stat label="Palabras por minuto" value={String(result.wpm)} />
          <Stat label="Récord personal" value={formatNumber(bestScore)} />
        </dl>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <NeonButton variant="primary" onClick={onRestart}>
            Volver a jugar
          </NeonButton>
          <NeonButton onClick={onMenu}>Menú principal</NeonButton>
        </div>
      </div>
    </div>
  );
}
