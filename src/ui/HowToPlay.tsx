import { MAX_POWER_STOCK } from '../game/constants';
import { POWERS } from '../game/powers';
import { POWER_TYPES } from '../game/types';
import { NeonButton, ScreenCard } from './controls';
import { PowerIcon } from './PowerIcon';

interface Props {
  onBack: () => void;
  onPlay: () => void;
}

function Key({ children }: { children: string }) {
  return (
    <kbd className="mx-0.5 inline-block rounded-md border border-electric/60 bg-navy-deep px-2 py-0.5 text-sm font-bold text-electric">
      {children}
    </kbd>
  );
}

export function HowToPlay({ onBack, onPlay }: Props) {
  return (
    <ScreenCard
      title="Cómo jugar"
      wide
      footer={
        <>
          <NeonButton onClick={onBack}>Volver</NeonButton>
          <NeonButton variant="primary" onClick={onPlay}>
            Jugar
          </NeonButton>
        </>
      }
    >
      <div className="grid gap-8 text-base leading-relaxed text-white/90 md:grid-cols-2">
        <div className="space-y-5">
          <section>
            <h3 className="mb-2 text-xl font-extrabold text-electric">Objetivo</h3>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Las palabras caen desde lo alto de la ciudad.</li>
              <li>
                Escribe una palabra completa y pulsa <Key>Enter</Key> para eliminarla.
              </li>
              <li>
                Si una palabra toca la <span className="font-bold text-neon-red">línea roja</span>, pierdes una vida.
                Tienes tres.
              </li>
              <li>Las tildes y la «ñ» cuentan; las mayúsculas no.</li>
            </ul>
          </section>
          <section>
            <h3 className="mb-2 text-xl font-extrabold text-electric">Puntuación</h3>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>10 puntos por letra, más un bonus si respondes rápido.</li>
              <li>
                Las rachas multiplican los puntos: 5 aciertos <b>x1,2</b>, 10 <b>x1,5</b>, 20 <b>x2</b> y 30{' '}
                <b>x3</b>.
              </li>
              <li>Un intento equivocado o una palabra perdida rompen la racha.</li>
              <li>
                Cada nivel es una etapa: al despejarla verás su resumen, ganarás una bonificación y tendrás una
                cuenta regresiva antes de la siguiente.
              </li>
            </ul>
          </section>
          <section>
            <h3 className="mb-2 text-xl font-extrabold text-electric">Controles</h3>
            <p>
              <Key>Enter</Key> confirma · <Key>1</Key>
              <Key>2</Key>
              <Key>3</Key>
              <Key>4</Key> activan poderes · <Key>Esc</Key> pausa.
            </p>
          </section>
        </div>

        <section>
          <h3 className="mb-2 text-xl font-extrabold text-electric">Poderes</h3>
          <p className="mb-3">
            Algunas palabras llegan con un borde de color y un icono. Escríbelas para guardar su poder (hasta{' '}
            {MAX_POWER_STOCK} de cada uno) y actívalo cuando lo necesites.
          </p>
          <ul className="space-y-3">
            {POWER_TYPES.map((type) => {
              const info = POWERS[type];
              return (
                <li
                  key={type}
                  className="flex items-center gap-4 rounded-xl border-2 bg-navy-deep/60 px-4 py-3"
                  style={{ borderColor: `${info.color}99` }}
                >
                  <PowerIcon type={type} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold" style={{ color: info.color }}>
                      {info.name}
                    </p>
                    <p className="text-sm text-white/80">{info.description}</p>
                  </div>
                  <Key>{info.hotkey}</Key>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </ScreenCard>
  );
}
