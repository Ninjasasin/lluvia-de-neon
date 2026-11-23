import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-electric text-navy-deep border-electric shadow-[0_0_22px_rgba(0,217,255,0.55)] hover:bg-white hover:border-white',
  secondary:
    'bg-navy-soft/80 text-white border-electric/60 hover:border-electric hover:bg-navy-soft hover:shadow-[0_0_18px_rgba(0,217,255,0.35)]',
  danger:
    'bg-navy-soft/80 text-neon-red border-neon-red/60 hover:border-neon-red hover:shadow-[0_0_18px_rgba(255,56,92,0.4)]',
};

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function NeonButton({ variant = 'secondary', className = '', type = 'button', ...rest }: NeonButtonProps) {
  return (
    <button
      type={type}
      className={`cursor-pointer rounded-xl border-2 px-6 py-3 text-lg font-extrabold tracking-wide transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  );
}

interface ScreenCardProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

/** Tarjeta centrada que usan las pantallas secundarias del menú. */
export function ScreenCard({ title, children, footer, wide = false }: ScreenCardProps) {
  return (
    <div className="relative z-10 flex h-full w-full items-center justify-center p-4">
      <section
        className={`neon-panel anim-pop flex max-h-full w-full flex-col rounded-3xl ${wide ? 'max-w-5xl' : 'max-w-2xl'}`}
      >
        <h2 className="neon-title border-b border-electric/25 px-8 py-5 text-3xl font-black">{title}</h2>
        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-electric/25 px-8 py-4">{footer}</div>}
      </section>
    </div>
  );
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** Selector de una opción entre varias, con aspecto de botones contiguos. */
export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex overflow-hidden rounded-xl border-2 border-electric/50">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`flex-1 cursor-pointer px-4 py-2 text-base font-bold transition focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sun ${
              selected ? 'bg-electric text-navy-deep' : 'bg-navy-deep/60 text-white/80 hover:bg-navy-soft'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
