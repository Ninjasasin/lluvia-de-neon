import { FREEZE_DURATION, LIGHTNING_TARGETS, SLOW_DURATION } from './constants';
import type { PowerType } from './types';

export interface PowerInfo {
  type: PowerType;
  name: string;
  /** Tecla rápida que lo activa. */
  hotkey: string;
  color: string;
  description: string;
  /** Peso relativo con el que aparece entre las palabras. */
  weight: number;
}

export const POWERS: Record<PowerType, PowerInfo> = {
  freeze: {
    type: 'freeze',
    name: 'Congelar',
    hotkey: '1',
    color: '#00D9FF',
    description: `Detiene todas las palabras durante ${FREEZE_DURATION} segundos.`,
    weight: 30,
  },
  slow: {
    type: 'slow',
    name: 'Ralentizar',
    hotkey: '2',
    color: '#FF9F43',
    description: `Reduce la velocidad de caída un 65 % durante ${SLOW_DURATION} segundos.`,
    weight: 30,
  },
  lightning: {
    type: 'lightning',
    name: 'Relámpago',
    hotkey: '3',
    color: '#FFD54A',
    description: `Elimina las ${LIGHTNING_TARGETS} palabras más cercanas al fondo (50 % de los puntos).`,
    weight: 25,
  },
  bomb: {
    type: 'bomb',
    name: 'Bomba',
    hotkey: '4',
    color: '#A855F7',
    description: 'Elimina todas las palabras normales en pantalla (25 % de los puntos).',
    weight: 15,
  },
};

/** Devuelve el poder asociado a una tecla, o null. */
export function powerForHotkey(key: string): PowerType | null {
  for (const info of Object.values(POWERS)) {
    if (info.hotkey === key) return info.type;
  }
  return null;
}

/** Elige un poder al azar respetando los pesos. `roll` es un número en [0, 1). */
export function pickPower(roll: number): PowerType {
  const infos = Object.values(POWERS);
  const total = infos.reduce((sum, p) => sum + p.weight, 0);
  let acc = roll * total;
  for (const info of infos) {
    acc -= info.weight;
    if (acc < 0) return info.type;
  }
  return infos[infos.length - 1].type;
}
