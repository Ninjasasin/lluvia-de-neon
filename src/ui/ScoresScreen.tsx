import { useState } from 'react';
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
        <table className="w-full border-separate border-spacing-y-1.5 text-base tabular-nums">
          <thead>
            <tr className="text-left text-sm tracking-wide text-electric uppercase">
              <th className="px-3 py-1">#</th>
              <th className="px-3 py-1 text-right">Puntaje</th>
              <th className="px-3 py-1 text-right">Nivel</th>
              <th className="px-3 py-1 text-right">Palabras</th>
              <th className="px-3 py-1 text-right">Precisión</th>
              <th className="px-3 py-1 text-right">Racha</th>
              <th className="px-3 py-1 text-right">PPM</th>
              <th className="px-3 py-1">Dificultad</th>
              <th className="px-3 py-1">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((entry, index) => (
              <tr key={`${entry.date}-${index}`} className={index === 0 ? 'bg-sun/15' : 'bg-navy-deep/60'}>
                <td className="rounded-l-lg px-3 py-2 font-extrabold text-white/70">{index + 1}</td>
                <td className={`px-3 py-2 text-right font-extrabold ${index === 0 ? 'text-sun' : 'text-white'}`}>
                  {formatNumber(entry.score)}
                </td>
                <td className="px-3 py-2 text-right">{entry.level}</td>
                <td className="px-3 py-2 text-right">{entry.wordsCleared}</td>
                <td className="px-3 py-2 text-right">{entry.accuracy} %</td>
                <td className="px-3 py-2 text-right">{entry.bestStreak}</td>
                <td className="px-3 py-2 text-right">{entry.wpm}</td>
                <td className="px-3 py-2">{DIFFICULTY_LABEL[entry.difficulty] ?? '—'}</td>
                <td className="rounded-r-lg px-3 py-2 text-white/70">{formatDate(entry.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ScreenCard>
  );
}
