import { FREEZE_DURATION, SLOW_DURATION } from '../game/constants';
import { POWERS } from '../game/powers';
import { POWER_TYPES, type HudState, type PowerType } from '../game/types';
import { formatSeconds } from './format';
import { keepFocus } from './Hud';
import { PowerIcon } from './PowerIcon';

interface Props {
  hud: HudState;
  disabled: boolean;
  onActivate: (power: PowerType) => void;
}

/** Panel lateral con los cuatro poderes, su cantidad y la tecla que los activa. */
export function PowerPanel({ hud, disabled, onActivate }: Props) {
  return (
    <aside
      aria-label="Poderes"
      className="power-panel flex flex-col rounded-2xl border-2 border-electric/60 bg-navy-deep/80 shadow-[0_0_18px_rgba(0,217,255,0.25)] backdrop-blur-sm"
    >
      {POWER_TYPES.map((type) => {
        const info = POWERS[type];
        const count = hud.inventory[type];
        const timeLeft = type === 'freeze' ? hud.freezeLeft : type === 'slow' ? hud.slowLeft : 0;
        const total = type === 'freeze' ? FREEZE_DURATION : SLOW_DURATION;
        const running = timeLeft > 0;
        const available = count > 0;
        const lit = available || running;
        return (
          <button
            key={type}
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onMouseDown={keepFocus}
            onClick={() => onActivate(type)}
            title={`${info.name} (tecla ${info.hotkey}): ${info.description}`}
            aria-label={`${info.name}: ${count} disponibles. Tecla ${info.hotkey}.`}
            className="group relative flex cursor-pointer flex-col items-center rounded-xl px-1 pt-1 pb-0.5 transition active:scale-95 disabled:cursor-default"
          >
            <span
              className="power-orb relative flex items-center justify-center rounded-full border-2 bg-navy transition group-hover:brightness-125"
              style={{
                borderColor: lit ? info.color : 'rgba(255, 255, 255, 0.18)',
                boxShadow: lit ? `0 0 14px ${info.color}88` : 'none',
                // Anillo de tiempo restante mientras el efecto está activo.
                background: running
                  ? `conic-gradient(${info.color}66 ${Math.min(360, (timeLeft / total) * 360)}deg, #07152E 0deg)`
                  : undefined,
              }}
            >
              <PowerIcon
                type={type}
                size={34}
                className={running ? 'anim-glow' : undefined}
                color={lit ? info.color : '#51607F'}
              />
            </span>
            <span className="absolute top-0 left-0 flex h-5 w-5 items-center justify-center rounded-md border border-white/40 bg-navy-deep text-xs font-bold text-white/85">
              {info.hotkey}
            </span>
            <span
              className="power-count mt-0.5 leading-tight font-extrabold tabular-nums"
              style={{ color: running ? info.color : available ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)' }}
            >
              {running ? `${formatSeconds(timeLeft)} s` : `x${count}`}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
