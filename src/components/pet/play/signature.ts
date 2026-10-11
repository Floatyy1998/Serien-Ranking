import type { Species } from '../../../lib/pet/petBrain';

/** Deutsche Namen der Spezialbewegungen (über t() übersetzt). */
export const SIGNATURE_LABEL: Record<Species, string> = {
  dragon: 'Fliegen üben',
  bird: 'Abheben',
  owl: 'Nachtflug',
  cat: 'Lauern',
  dog: 'Schwanz jagen',
  fox: 'Mäusesprung',
  rabbit: 'Luftsprung',
  panda: 'Purzelbaum',
  penguin: 'Rutschen',
  axolotl: 'Blubbern',
};
