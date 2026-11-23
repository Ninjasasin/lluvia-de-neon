import type { ReactNode } from 'react';
import { BACKGROUND_IDS, BACKGROUND_NAMES } from '../game/backgrounds';
import type { EffectsLevel, Settings, TextSize } from '../game/storage';
import type { Difficulty } from '../game/types';
import { NeonButton, ScreenCard, Segmented } from './controls';
import { SceneThumbnail } from './SceneBackdrop';
import { useFullscreen } from './useFullscreen';

interface Props {
  settings: Settings;
  onChange: (settings: Settings) => void;
  /** Reproduce un sonido de muestra al ajustar el volumen de efectos. */
  onPreviewSfx: () => void;
  onBack: () => void;
}

const EFFECT_OPTIONS: readonly { value: EffectsLevel; label: string }[] = [
  { value: 'full', label: 'Completa' },
  { value: 'reduced', label: 'Reducida' },
  { value: 'minimal', label: 'Mínima' },
];

const TEXT_OPTIONS: readonly { value: TextSize; label: string }[] = [
  { value: 'small', label: 'Pequeño' },
  { value: 'medium', label: 'Mediano' },
  { value: 'large', label: 'Grande' },
];

const DIFFICULTY_OPTIONS: readonly { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Fácil' },
  { value: 'normal', label: 'Normal' },
  { value: 'hard', label: 'Difícil' },
];

const TEXT_PREVIEW_PX: Record<TextSize, number> = { small: 20, medium: 24, large: 29 };

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid items-center gap-x-6 gap-y-2 py-3.5 sm:grid-cols-[14rem_1fr]">
      <div>
        <p className="text-lg font-bold">{label}</p>
        {hint && <p className="text-sm text-white/60">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

interface VolumeProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onCommit?: () => void;
}

function Volume({ label, value, onChange, onCommit }: VolumeProps) {
  const percent = Math.round(value * 100);
  return (
    <div className="flex items-center gap-4">
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={percent}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
        className="h-2 flex-1 cursor-pointer"
      />
      <span className="w-14 text-right text-lg font-bold text-electric tabular-nums">
        {percent === 0 ? 'No' : `${percent}%`}
      </span>
    </div>
  );
}

export function SettingsScreen({ settings, onChange, onPreviewSfx, onBack }: Props) {
  const fullscreen = useFullscreen();
  const update = (patch: Partial<Settings>) => onChange({ ...settings, ...patch });

  return (
    <ScreenCard
      title="Configuración"
      footer={
        <NeonButton variant="primary" onClick={onBack}>
          Listo
        </NeonButton>
      }
    >
      <div className="divide-y divide-electric/15">
        <div className="pb-4">
          <p className="text-lg font-bold">Fondo</p>
          <p className="mb-3 text-sm text-white/60">Escenario del juego y de los menús.</p>
          <div role="radiogroup" aria-label="Fondo" className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {BACKGROUND_IDS.map((id) => {
              const selected = settings.background === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => update({ background: id })}
                  className={`group cursor-pointer overflow-hidden rounded-xl border-2 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun ${
                    selected
                      ? 'border-electric shadow-[0_0_16px_rgba(0,217,255,0.6)]'
                      : 'border-white/20 hover:border-electric/70'
                  }`}
                >
                  <SceneThumbnail theme={id} className="block aspect-[8/5] w-full" />
                  <span
                    className={`block truncate px-2 py-1.5 text-xs font-bold sm:text-sm ${
                      selected ? 'bg-electric text-navy-deep' : 'bg-navy-deep/80 text-white/85'
                    }`}
                  >
                    {BACKGROUND_NAMES[id]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <Row label="Música">
          <Volume label="Volumen de la música" value={settings.musicVolume} onChange={(v) => update({ musicVolume: v })} />
        </Row>
        <Row label="Efectos de sonido">
          <Volume
            label="Volumen de los efectos"
            value={settings.sfxVolume}
            onChange={(v) => update({ sfxVolume: v })}
            onCommit={onPreviewSfx}
          />
        </Row>
        <Row label="Animaciones" hint="Partículas, vibración y destellos.">
          <Segmented
            label="Intensidad de animaciones"
            value={settings.effects}
            options={EFFECT_OPTIONS}
            onChange={(effects) => update({ effects })}
          />
        </Row>
        <Row label="Tamaño del texto" hint="Tamaño de las palabras que caen.">
          <Segmented
            label="Tamaño del texto"
            value={settings.textSize}
            options={TEXT_OPTIONS}
            onChange={(textSize) => update({ textSize })}
          />
          <div className="mt-3 flex h-16 items-center">
            <span
              className="rounded-xl border-2 border-[#CFEFFF] bg-navy/90 px-4 py-1.5 font-extrabold shadow-[0_0_14px_rgba(0,217,255,0.5)]"
              style={{ fontSize: TEXT_PREVIEW_PX[settings.textSize] }}
            >
              ejemplo
            </span>
          </div>
        </Row>
        <Row label="Dificultad inicial" hint="Cambia la velocidad y el ritmo de aparición.">
          <Segmented
            label="Dificultad inicial"
            value={settings.difficulty}
            options={DIFFICULTY_OPTIONS}
            onChange={(difficulty) => update({ difficulty })}
          />
        </Row>
        <Row label="Pantalla completa">
          <NeonButton
            className="px-4 py-2 text-base"
            onClick={fullscreen.toggle}
            disabled={!fullscreen.supported}
            aria-pressed={fullscreen.active}
          >
            {!fullscreen.supported ? 'No disponible' : fullscreen.active ? 'Salir de pantalla completa' : 'Activar pantalla completa'}
          </NeonButton>
        </Row>
      </div>
    </ScreenCard>
  );
}
