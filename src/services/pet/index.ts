import {
  getUserPets,
  getUserPet,
  getActivePetId,
  setActivePetId,
  canCreateNewPet,
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

import {
  toggleAccessory,
  changePetColor,
  claimAccessoryDrop,
  equipBackground,
} from './petAccessoryManager';
import {
  canSpinToday,
  performDailySpin,
  getDailySpinData,
  getActiveXpBoost,
  getXpBoostInventory,
  activateXpBoost,
} from './dailySpinService';
import {
  getAvailableBoxCount,
  getNextBoxThreshold,
  getProgressToNextBox,
  openMysteryBox,
} from './mysteryBoxService';

export const petService = {
  getUserPets,
  getUserPet,
  getActivePetId,
  setActivePetId,
  canCreateNewPet,
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
  claimAccessoryDrop,
  equipBackground,
  canSpinToday,
  performDailySpin,
  getDailySpinData,
  getActiveXpBoost,
  getXpBoostInventory,
  activateXpBoost,
  getAvailableBoxCount,
  getNextBoxThreshold,
  getProgressToNextBox,
  openMysteryBox,
};
