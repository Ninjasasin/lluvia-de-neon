import { useEffect, useRef, type MouseEvent } from 'react';
import { INITIAL_LIVES } from '../game/constants';
import type { HudState } from '../game/types';
import { formatMultiplier, formatNumber } from './format';

interface Props {
  hud: HudState;
  onPause: () => void;
}

/** Evita que un clic en la interfaz le quite el foco a la caja de escritura. */
export function keepFocus(event: MouseEvent): void {
  event.preventDefault();
}

const HEART_PATH =
  'M12 20.5C7 16.6 2.5 13 2.5 8.6 2.5 5.8 4.6 3.8 7.2 3.8c1.9 0 3.6 1 4.8 2.7 1.2-1.7 2.9-2.7 4.8-2.7 2.6 0 4.7 2 4.7 4.8 0 4.4-4.5 8-9.5 11.900z';

function Heart({ filled }: { filled: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  const wasFilled = useRef(filled);

  useEffect(() => {
    if (wasFilled.current && !filled) {
      const el = ref.current;
      if (el) {
        el.classList.remove('anim-heart-lost');
        void el.getBoundingClientRect();
        el.classList.add('anim-heart-lost');
      }
    }
    wasFilled.current = filled;
  }, [filled]);

  return (
    <svg ref={ref} viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
      <path
        d={HEART_PATH}
        fill={filled ? '#FF385C' : 'rgba(255, 56, 92, 0.12)'}
        stroke={filled ? '#FF8FA3' : 'rgba(255, 56, 92, 0.45)'}
        strokeWidth={1.5}
        style={filled ? { filter: 'drop-shadow(0 0 6px rgba(255, 56, 92, 0.8))' } : undefined}
      />
    </svg>
  );
}

/** Barra superior: pausa, puntaje, nivel, multiplicador y vidas. */
export function Hud({ hud, onPause }: Props) {
  const boosted = hud.multiplier > 1;
  return (
    <header className="grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b-2 border-electric/35 bg-navy-deep/90 px-3">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={keepFocus}
          onClick={onPause}
          aria-label="Pausar la partida"
          title="Pausa (Esc)"
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 border-electric bg-navy-soft shadow-[0_0_14px_rgba(0,217,255,0.4)] transition hover:bg-electric/25 active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1" fill="#00D9FF" />
            <rect x="14" y="5" width="4" height="14" rx="1" fill="#00D9FF" />
          </svg>
        </button>
        <p className="truncate text-xl font-extrabold">
          <span className="text-white/70">Puntaje: </span>
          <span className="tabular-nums">{formatNumber(hud.score)}</span>
        </p>
      </div>

      <div className="relative overflow-hidden rounded-xl border-2 border-electric/70 bg-navy-soft px-6 py-1.5 shadow-[0_0_14px_rgba(0,217,255,0.25)]">
        <p className="text-center text-xl leading-tight font-extrabold whitespace-nowrap">Nivel {hud.level}</p>
        {hud.lastWords && (
          <p className="text-center text-[11px] leading-none font-bold tracking-wide whitespace-nowrap text-sun uppercase">
            Últimas palabras
          </p>
        )}
        <div
          className={`absolute bottom-0 left-0 h-1 transition-[width] duration-500 ${hud.lastWords ? 'bg-sun' : 'bg-electric'}`}
          style={{ width: `${Math.round(hud.levelProgress * 100)}%` }}
          role="progressbar"
          aria-label="Progreso del nivel"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(hud.levelProgress * 100)}
        />
      </div>

      <div className="flex items-center justify-end gap-4">
        <div
          className={`flex items-baseline gap-2 rounded-xl border-2 px-3 py-1 whitespace-nowrap transition ${
            boosted
              ? 'border-sun bg-sun/15 text-sun shadow-[0_0_14px_rgba(255,213,74,0.45)]'
              : 'border-white/20 bg-navy-soft/60 text-white/60'
          }`}
          title="Multiplicador por racha de aciertos"
        >
          <span className="text-xl font-black tabular-nums">{formatMultiplier(hud.multiplier)}</span>
          <span className="hidden text-sm font-bold sm:inline">Racha {hud.streak}</span>
        </div>
        <div className="flex gap-1" role="img" aria-label={`Vidas: ${hud.lives} de ${INITIAL_LIVES}`}>
          {Array.from({ length: INITIAL_LIVES }, (_, i) => (
            <Heart key={i} filled={i < hud.lives} />
          ))}
        </div>
      </div>
    </header>
  );
}
