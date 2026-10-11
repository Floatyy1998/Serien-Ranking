import type { Pet } from '../../types/pet.types';

export const DEV_PET_TYPES: Pet['type'][] = [
  'cat',
  'dog',
  'bird',
  'dragon',
  'fox',
  'rabbit',
  'panda',
  'owl',
  'penguin',
  'axolotl',
];
const COLORS = [
  'orange',
  'rosa',
  'tuerkis',
  'lila',
  'rot',
  'gelb',
  'gruen',
  'blau',
  'tuerkis',
  'rosa',
];

export function makeDevPet(type: Pet['type'], level: number, extras: Partial<Pet> = {}): Pet {
  return {
    id: `dev-${type}-${level}`,
    userId: 'dev',
    name: 'Mochi',
    type,
    color: COLORS[DEV_PET_TYPES.indexOf(type)] ?? 'blau',
    level,
    experience: 0,
    hunger: 10,
    happiness: 95,
    lastFed: new Date(),
    episodesWatched: 0,
    createdAt: new Date(),
    isAlive: true,
    ...extras,
  };
}
