import logoUrl from '../assets/logo-ninjasasin.webp';
import { GAME_AUTHOR, GAME_TAGLINE, GAME_TITLE } from '../config';
import { NeonButton } from './controls';
import { formatNumber } from './format';

interface Props {
  bestScore: number;
  onPlay: () => void;
  onHowTo: () => void;
  onSettings: () => void;
  onScores: () => void;
}

/** Fichas decorativas que caen detrás del menú. */
const CHIPS = [
  { word: 'ciudad', left: '8%', duration: 17, delay: 0 },
  { word: 'neón', left: '24%', duration: 21, delay: 6 },
  { word: 'teclado', left: '71%', duration: 19, delay: 2 },
  { word: 'ritmo', left: '86%', duration: 23, delay: 9 },
  { word: 'veloz', left: '55%', duration: 25, delay: 13 },
  { word: 'lluvia', left: '38%', duration: 20, delay: 16 },
];

export function MainMenu({ bestScore, onPlay, onHowTo, onSettings, onScores }: Props) {
  return (
    <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-10 p-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {CHIPS.map((chip) => (
          <span
            key={chip.word}
            className="menu-chip absolute top-0 rounded-xl border-2 border-electric/50 bg-navy/70 px-4 py-1.5 text-xl font-extrabold text-white/80 opacity-0"
            style={{
              left: chip.left,
              animationDuration: `${chip.duration}s`,
              animationDelay: `${chip.delay}s`,
            }}
          >
            {chip.word}
          </span>
        ))}
      </div>

      <header className="anim-pop relative text-center">
        <p className="mb-3 text-sm font-bold tracking-[0.45em] text-electric uppercase">{GAME_TAGLINE}</p>
        <h1 className="neon-title text-6xl leading-none font-black sm:text-7xl md:text-8xl">{GAME_TITLE}</h1>
        <div className="mx-auto mt-5 h-1 w-56 rounded-full bg-neon-red shadow-[0_0_18px_rgba(255,56,92,0.9)]" />
      </header>

      <nav className="anim-pop relative flex w-full max-w-xs flex-col gap-3" aria-label="Menú principal">
        <NeonButton variant="primary" className="py-4 text-2xl" onClick={onPlay} autoFocus>
          Jugar
        </NeonButton>
        <NeonButton onClick={onHowTo}>Cómo jugar</NeonButton>
        <NeonButton onClick={onSettings}>Configuración</NeonButton>
        <NeonButton onClick={onScores}>Mejores puntuaciones</NeonButton>
      </nav>

      <figure className="absolute right-3 bottom-3 m-0 sm:right-5 sm:bottom-5">
        <figcaption className="mb-1 text-right text-[11px] font-bold tracking-[0.2em] text-white/75 uppercase">
          Creado por <span className="text-white">{GAME_AUTHOR}</span>
        </figcaption>
        <img
          src={logoUrl}
          alt={`Logo de ${GAME_AUTHOR}: un ninja con katana frente a un sol rojo`}
          width={1536}
          height={1024}
          className="ml-auto block h-auto w-[clamp(112px,17vw,210px)] rounded-xl border-2 border-neon-red/70 shadow-[0_0_18px_rgba(255,56,92,0.45)]"
        />
      </figure>

      <p className="relative text-base font-semibold text-white/75">
        {bestScore > 0 ? (
          <>
            Récord personal: <span className="font-extrabold text-sun">{formatNumber(bestScore)}</span>
          </>
        ) : (
          'Escribe las palabras antes de que toquen la línea roja.'
        )}
      </p>
    </div>
  );
}
