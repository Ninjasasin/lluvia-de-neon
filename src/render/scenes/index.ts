import type { BackgroundTheme } from '../../game/backgrounds';
import { auroraScene } from './aurora';
import { cityScene } from './city';
import type { Scene } from './common';
import { japanScene } from './japan';
import { oceanScene } from './ocean';
import { prehistoricScene } from './prehistoric';
import { spaceScene } from './space';

/** Para añadir un fondo: crea su escena, regístrala aquí y añade su nombre en `game/backgrounds.ts`. */
export const SCENES: Record<BackgroundTheme, Scene> = {
  city: cityScene,
  space: spaceScene,
  prehistoric: prehistoricScene,
  ocean: oceanScene,
  japan: japanScene,
  aurora: auroraScene,
};
