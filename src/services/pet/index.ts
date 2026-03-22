import {
  getUserPets,
  getUserPet,
  getActivePetId,
  setActivePetId,
  canCreateSecondPet,
  createPet,
  deletePet,
  getPetWidgetPosition,
  savePetWidgetPosition,
} from './petCore';

import {
  feedPet,
  playWithPet,
  updatePetStatus,
  updateAllPetsStatus,
  revivePet,
  activateStreakShield,
} from './petStatusManager';

import {
  watchedEpisode,
  watchedSeriesWithGenre,
  watchedSeriesWithGenreAllPets,
} from './petProgressManager';

import { toggleAccessory, changePetColor, changePetPattern } from './petAccessoryManager';

export const petService = {
  getUserPets,
  getUserPet,
  getActivePetId,
  setActivePetId,
  canCreateSecondPet,
  createPet,
  deletePet,
  getPetWidgetPosition,
  savePetWidgetPosition,
  feedPet,
  playWithPet,
  updatePetStatus,
  updateAllPetsStatus,
  revivePet,
  activateStreakShield,
  watchedEpisode,
  watchedSeriesWithGenre,
  watchedSeriesWithGenreAllPets,
  toggleAccessory,
  changePetColor,
  changePetPattern,
};
