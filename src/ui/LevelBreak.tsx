import { INITIAL_LIVES } from '../game/constants';
import { paramsForLevel } from '../game/difficulty';
import type { Difficulty, LevelSummary } from '../game/types';
import { NeonButton } from './controls';
import { formatNumber } from './format';

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-electric/30 bg-navy-deep/70 px-3 py-2">
      <dt className="text-xs font-semibold text-white/65 sm:text-sm">{label}</dt>
      <dd className={`text-xl font-extrabold tabular-nums sm:text-2xl ${accent ? 'text-sun' : ''}`}>{value}</dd>
    </div>
  );
}

interface SummaryProps {
  summary: LevelSummary;
  onContinue: () => void;
}

/** Resumen del nivel superado. Se queda en pantalla hasta que el jugador decide continuar. */
export function LevelSummaryCard({ summary, onContinue }: SummaryProps) {
  return (
    <div
      className="anim-fade absolute inset-0 z-10 flex overflow-y-auto bg-navy-deep/70 p-3 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={`Nivel ${summary.level} superado`}
    >
      <div className="neon-panel anim-pop m-auto w-full max-w-lg rounded-3xl p-4 text-center sm:p-6">
        <p className="text-xs font-bold tracking-[0.3em] text-electric uppercase sm:text-sm">Etapa completada</p>
        <h2 className="text-3xl font-black text-sun [text-shadow:0_0_18px_rgba(255,213,74,0.7)] sm:text-4xl">
          ¡Nivel {summary.level} superado!
        </h2>
        {summary.perfect && (
          <p className="anim-glow mx-auto mt-2 inline-block rounded-full border-2 border-sun bg-sun/15 px-4 py-0.5 text-sm font-extrabold text-sun">
            Nivel perfecto: sin errores ni vidas perdidas
          </p>
        )}

        <dl className="mt-3 grid grid-cols-3 gap-2 text-left sm:mt-4">
          <Stat label="Palabras" value={String(summary.wordsCleared)} />
          <Stat label="Precisión" value={`${summary.accuracy} %`} />
          <Stat label="Mejor racha" value={String(summary.bestStreak)} />
          <Stat label="Por minuto" value={String(summary.wpm)} />
          <Stat label="Puntos" value={formatNumber(summary.points)} />
          <Stat label="Bonificación" value={`+${formatNumber(summary.bonus)}`} accent />
        </dl>

        <p className="mt-3 text-sm font-semibold text-white/75">
          {summary.livesLost === 0
            ? `Conservas ${summary.livesLeft} de ${INITIAL_LIVES} vidas.`
            : `Perdiste ${summary.livesLost} ${summary.livesLost === 1 ? 'vida' : 'vidas'}: te ${
                summary.livesLeft === 1 ? 'queda 1' : `quedan ${summary.livesLeft}`
              }.`}
        </p>

        <div className="mt-3 flex flex-col items-center gap-1.5 sm:mt-4">
          <NeonButton variant="primary" tabIndex={-1} onClick={onContinue}>
            Siguiente nivel
          </NeonButton>
          <p className="text-xs text-white/60 sm:text-sm">
            Tómate un respiro. Pulsa <b className="text-electric">Enter</b> cuando quieras seguir.
          </p>
        </div>
      </div>
    </div>
  );
}

interface CountdownProps {
  level: number;
  value: number;
  difficulty: Difficulty;
}

/** Cuenta regresiva de 5 a 0 antes de que empiece el nivel. */
export function CountdownOverlay({ level, value, difficulty }: CountdownProps) {
  const params = paramsForLevel(level, difficulty);
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-[radial-gradient(circle,rgba(4,11,28,0.82)_0%,rgba(4,11,28,0.35)_55%,rgba(4,11,28,0)_80%)] text-center"
      role="timer"
      aria-live="assertive"
      aria-label={`El nivel ${level} empieza en ${value}`}
    >
      <p className="text-lg font-bold tracking-[0.35em] text-electric uppercase sm:text-xl">Nivel {level}</p>
      <p
        key={value}
        className={`anim-count text-[7rem] leading-none font-black tabular-nums sm:text-[9rem] ${
          value === 0 ? 'text-sun [text-shadow:0_0_30px_rgba(255,213,74,0.8)]' : 'neon-title'
        }`}
      >
        {value}
      </p>
      <p className="text-base font-bold text-white/85 sm:text-lg">{value === 0 ? '¡A escribir!' : 'Prepárate…'}</p>
      <p className="mt-1 text-sm text-white/60">
        Palabras de {params.minLen} a {params.maxLen} letras
      </p>
    </div>
  );
}
