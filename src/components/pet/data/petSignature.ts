import type { Pet } from '../../../types/pet.types';

/** Gestalten in Anzeige-Reihenfolge, jede mit ihrer Signaturfarbe (Key aus PET_COLORS). */
export const PET_SIGNATURES: { type: Pet['type']; label: string; color: string }[] = [
  { type: 'cat', label: 'Katze', color: 'orange' },
  { type: 'dog', label: 'Hund', color: 'gelb' },
  { type: 'fox', label: 'Fuchs', color: 'rot' },
  { type: 'rabbit', label: 'Hase', color: 'rosa' },
  { type: 'panda', label: 'Panda', color: 'gruen' },
  { type: 'bird', label: 'Vogel', color: 'tuerkis' },
  { type: 'dragon', label: 'Drache', color: 'lila' },
  { type: 'owl', label: 'Eule', color: 'orange' },
  { type: 'penguin', label: 'Pinguin', color: 'blau' },
  { type: 'axolotl', label: 'Axolotl', color: 'rosa' },
];

export const petSignatureColor = (type: Pet['type']): string =>
  PET_SIGNATURES.find((x) => x.type === type)?.color ?? 'blau';

export const PET_COLOR_LABELS: Record<string, string> = {
  rot: 'Rot',
  blau: 'Blau',
  gruen: 'Grün',
  lila: 'Lila',
  gelb: 'Gelb',
  rosa: 'Rosa',
  orange: 'Orange',
  tuerkis: 'Türkis',
};
