import { WordBank, type DictionaryFile } from './words';

/**
 * Carga todos los archivos JSON de `src/data/diccionario`.
 * Para ampliar el diccionario basta con añadir palabras a un archivo existente
 * o crear uno nuevo con el mismo formato: se incluye automáticamente.
 */
const modules = import.meta.glob<DictionaryFile>('../data/diccionario/*.json', {
  eager: true,
  import: 'default',
});

export const DICTIONARY_FILES: DictionaryFile[] = Object.keys(modules)
  .sort()
  .map((path) => modules[path]);

export function createWordBank(): WordBank {
  return new WordBank(DICTIONARY_FILES);
}
