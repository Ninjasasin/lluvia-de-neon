/** Fondos disponibles. El primero es el predeterminado. */
export const BACKGROUND_IDS = ['city', 'space', 'prehistoric', 'ocean', 'japan', 'aurora'] as const;

export type BackgroundTheme = (typeof BACKGROUND_IDS)[number];

export const DEFAULT_BACKGROUND: BackgroundTheme = 'city';

export const BACKGROUND_NAMES: Record<BackgroundTheme, string> = {
  city: 'Ciudad nocturna',
  space: 'Espacio alienígena',
  prehistoric: 'Prehistoria',
  ocean: 'Fondo del mar',
  japan: 'Japón samurái',
  aurora: 'Aurora polar',
};
