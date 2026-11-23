import { POWERS } from '../game/powers';
import type { PowerType } from '../game/types';
import { POWER_ICONS } from '../render/icons';

interface Props {
  type: PowerType;
  size?: number;
  color?: string;
  className?: string;
}

/** Icono de un poder en SVG. Usa los mismos trazos que el Canvas. */
export function PowerIcon({ type, size = 32, color, className }: Props) {
  const icon = POWER_ICONS[type];
  const tint = color ?? POWERS[type].color;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={{ color: tint }}
      aria-hidden="true"
    >
      {icon.fill.map((d) => (
        <path key={d} d={d} fill={tint} />
      ))}
      {icon.stroke.map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke={tint}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
