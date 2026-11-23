import { useState } from 'react';
import { RANKS, rankForScore } from '../game/ranks';
import type { ScoreEntry } from '../game/storage';
import type { Difficulty } from '../game/types';
import { NeonButton, ScreenCard } from './controls';
import { formatDate, formatNumber } from './format';

interface Props {
  scores: ScoreEntry[];
  onClear: () => void;
  onBack: () => void;
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: 'Fácil', normal: 'Normal', hard: 'Difícil' };

export function ScoresScreen({ scores, onClear, onBack }: Props) {
  const [confirming, setConfirming] = useState(false);
  /** Mejor rango alcanzado hasta ahora, o null si aún no hay partidas guardadas. */
  const bestRank = scores.length > 0 ? rankForScore(scores[0].score) : null;

  return (
    <ScreenCard
      title="Mejores puntuaciones"
      wide
      footer={
        <>
          {scores.length > 0 &&
            (confirming ? (
              <>
                <span className="mr-auto self-center text-base font-semibold text-white/80">
                  ¿Borrar todas las puntuaciones?
                </span>
                <NeonButton
                  variant="danger"
                  onClick={() => {
                    onClear();
                    setConfirming(false);
                  }}
                >
                  Sí, borrar
                </NeonButton>
                <NeonButton onClick={() => setConfirming(false)}>Cancelar</NeonButton>
              </>
            ) : (
              <NeonButton variant="danger" className="mr-auto" onClick={() => setConfirming(true)}>
                Borrar puntuaciones
              </NeonButton>
            ))}
          {!confirming && (
            <NeonButton variant="primary" onClick={onBack}>
              Volver
            </NeonButton>
          )}
        </>
      }
    >
      {scores.length === 0 ? (
        <p className="py-10 text-center text-lg text-white/75">
          Todavía no hay puntuaciones guardadas. Juega una partida para estrenar la tabla.
        </p>
      ) : (
        <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-1.5 text-base tabular-nums">
          <thead>
            <tr className="text-left text-sm tracking-wide text-electric uppercase">
              <th className="px-2.5 py-1">#</th>
              <th className="px-2.5 py-1">Nombre</th>
              <th className="px-2.5 py-1 text-right">Puntaje</th>
              <th className="px-2.5 py-1">Rango</th>
              <th className="px-2.5 py-1 text-right">Nivel</th>
              <th className="px-2.5 py-1 text-right">Palabras</th>
              <th className="px-2.5 py-1 text-right">Precisión</th>
              <th className="px-2.5 py-1 text-right">Racha</th>
              <th className="px-2.5 py-1 text-right">PPM</th>
              <th className="px-2.5 py-1">Dificultad</th>
              <th className="px-2.5 py-1">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((entry, index) => (
              <tr key={entry.id} className={index === 0 ? 'bg-sun/15' : 'bg-navy-deep/60'}>
                <td className="rounded-l-lg px-2.5 py-2 font-extrabold text-white/70">{index + 1}</td>
                <td className="px-2.5 py-2 font-extrabold tracking-wider whitespace-nowrap">{entry.name}</td>
                <td className={`px-2.5 py-2 text-right font-extrabold ${index === 0 ? 'text-sun' : 'text-white'}`}>
                  {formatNumber(entry.score)}
                </td>
                <td className="px-2.5 py-2 whitespace-nowrap">
                  <span aria-hidden="true">{rankForScore(entry.score).emoji}</span> {rankForScore(entry.score).name}
                </td>
                <td className="px-2.5 py-2 text-right">{entry.level}</td>
                <td className="px-2.5 py-2 text-right">{entry.wordsCleared}</td>
                <td className="px-2.5 py-2 text-right">{entry.accuracy} %</td>
                <td className="px-2.5 py-2 text-right">{entry.bestStreak}</td>
                <td className="px-2.5 py-2 text-right">{entry.wpm}</td>
                <td className="px-2.5 py-2">{DIFFICULTY_LABEL[entry.difficulty] ?? '—'}</td>
                <td className="rounded-r-lg px-2.5 py-2 text-white/70">{formatDate(entry.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      <section className="mt-6 border-t border-electric/20 pt-4">
        <h3 className="text-lg font-extrabold text-electric">Escala de rangos</h3>
        <p className="mb-3 text-sm text-white/60">Al terminar cada partida, tu puntuación decide qué eres.</p>
        <ol className="flex flex-wrap gap-2">
          {RANKS.map((rank) => {
            const reached = bestRank !== null && rank.min <= bestRank.min;
            return (
              <li
                key={rank.name}
                className={`rounded-xl border-2 px-3 py-1.5 text-sm font-bold ${
                  rank === bestRank
                    ? 'border-sun bg-sun/20 text-sun shadow-[0_0_12px_rgba(255,213,74,0.4)]'
                    : reached
                      ? 'border-electric/50 bg-navy-deep/60 text-white'
                      : 'border-white/15 bg-navy-deep/40 text-white/45'
                }`}
                title={rank.phrase}
              >
                <span aria-hidden="true">{rank.emoji}</span> {rank.name}{' '}
                <span className="font-semibold tabular-nums opacity-70">{formatNumber(rank.min)}</span>
              </li>
            );
          })}
        </ol>
      </section>
    </ScreenCard>
  );
}
