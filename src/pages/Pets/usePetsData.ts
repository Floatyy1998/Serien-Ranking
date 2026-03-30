/**
 * usePetsData - Custom hook for all PetsPage state & business logic
 */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { petService } from '../../services/petService';
import { petMoodService } from '../../services/pet/petMoodService';
import { PET_CONFIG } from '../../services/pet/petConstants';
import { ACCESSORIES } from '../../types/pet.types';
import type { Pet } from '../../types/pet.types';

export function usePetsData() {
  const authContext = useAuth();
  const user = authContext?.user;

  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetIndex, setSelectedPetIndex] = useState(0);
  const [canAddNewPet, setCanAddSecondPet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [petName, setPetName] = useState('');
  const [selectedType, setSelectedType] = useState<Pet['type']>('cat');
  const [activeColorBorder, setActiveColorBorder] = useState<string | null>(null);
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);

  const pet = pets[selectedPetIndex] ?? null;

  // --- Derived values ---
  const currentMood = pet ? petMoodService.calculateCurrentMood(pet) : null;
  const hungerPercentage = pet ? Math.max(0, 100 - pet.hunger) : 0;
  const happinessPercentage = pet ? pet.happiness : 0;
  const experienceNeeded = pet ? pet.level * 100 : 100;
  const experiencePercentage = pet ? (pet.experience / experienceNeeded) * 100 : 0;

  const isHealthy = pet
    ? pet.hunger < PET_CONFIG.HEALTHY_HUNGER_THRESHOLD &&
      pet.happiness > PET_CONFIG.HEALTHY_HAPPINESS_THRESHOLD
    : false;

  const xpBonusHint = pet
    ? pet.hunger >= PET_CONFIG.HEALTHY_HUNGER_THRESHOLD
      ? 'Füttere dein Pet um den +50% XP-Bonus zu aktivieren!'
      : 'Spiele mit deinem Pet um den +50% XP-Bonus zu aktivieren!'
    : '';

  // --- Load pets on mount ---
  const loadPets = useCallback(async () => {
    if (!user) return;
    try {
      const updatedPets = await petService.updateAllPetsStatus(user.uid);
      if (updatedPets.length > 0) {
        setPets(updatedPets);
        setActiveColorBorder(updatedPets[selectedPetIndex]?.color || updatedPets[0].color);

        // Aktives Pet aus DB laden und Index setzen
        const activePetId = await petService.getActivePetId(user.uid);
        if (activePetId) {
          const idx = updatedPets.findIndex((p) => p.id === activePetId);
          if (idx >= 0) setSelectedPetIndex(idx);
        }
      } else {
        setShowCreateModal(true);
      }

      const canAdd = await petService.canCreateNewPet(user.uid);
      setCanAddSecondPet(canAdd);
    } catch (error) {
      console.error('Error loading pets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedPetIndex]);

  useEffect(() => {
    if (user) {
      loadPets();
    }
  }, [user, loadPets]);

  const createPet = async () => {
    if (!user || !petName.trim()) return;
    try {
      const newPet = await petService.createPet(user.uid, petName.trim(), selectedType);
      setPets((prev) => [...prev, newPet]);
      setSelectedPetIndex(pets.length); // neues Pet auswählen
      setShowCreateModal(false);
      setPetName('');
      const canAdd = await petService.canCreateNewPet(user.uid);
      setCanAddSecondPet(canAdd);
    } catch (error) {
      console.error('Error creating pet:', error);
    }
  };

  const feedPet = async () => {
    if (!user || !pet) return;
    try {
      const updatedPet = await petService.feedPet(user.uid, pet.id);
      if (updatedPet) setPets((prev) => prev.map((p) => (p.id === updatedPet.id ? updatedPet : p)));
    } catch (error) {
      console.error('Error feeding pet:', error);
    }
  };

  const playWithPet = async () => {
    if (!user || !pet) return;
    try {
      const updatedPet = await petService.playWithPet(user.uid, pet.id);
      if (updatedPet) setPets((prev) => prev.map((p) => (p.id === updatedPet.id ? updatedPet : p)));
    } catch (error) {
      console.error('Error playing with pet:', error);
    }
  };

  const revivePet = async () => {
    if (!user || !pet) return;
    try {
      const revivedPet = await petService.revivePet(user.uid, pet.id);
      if (revivedPet) setPets((prev) => prev.map((p) => (p.id === revivedPet.id ? revivedPet : p)));
    } catch (error) {
      console.error('Error reviving pet:', error);
    }
  };

  const releasePet = async () => {
    if (!user || !pet) return;
    try {
      await petService.deletePet(user.uid, pet.id);
      const remaining = pets.filter((p) => p.id !== pet.id);
      setPets(remaining);
      setShowReleaseConfirm(false);

      if (remaining.length > 0) {
        setSelectedPetIndex(0);
        setActiveColorBorder(remaining[0].color);
        await petService.setActivePetId(user.uid, remaining[0].id);
      } else {
        setSelectedPetIndex(0);
        setShowCreateModal(true);
      }

      const canAdd = await petService.canCreateNewPet(user.uid);
      setCanAddSecondPet(canAdd);
    } catch (error) {
      console.error('Error releasing pet:', error);
    }
  };

  const changeColor = async (newColor: string) => {
    if (!user || !pet) return;
    setActiveColorBorder(newColor);

    try {
      const updatedPet = await petService.changePetColor(user.uid, pet.id, newColor);
      if (updatedPet) {
        setPets((prev) => prev.map((p) => (p.id === updatedPet.id ? updatedPet : p)));
      }
    } catch (error) {
      console.error('Error changing color:', error);
      setActiveColorBorder(pet.color);
    }
  };

  const toggleAccessory = async (accessoryId: string) => {
    if (!user || !pet) return;
    const currentAccessories = pet.accessories || [];
    const accessoryIndex = currentAccessories.findIndex((acc) => acc.id === accessoryId);

    let newAccessories;
    if (accessoryIndex >= 0) {
      const isEquipping = !currentAccessories[accessoryIndex].equipped;
      newAccessories = currentAccessories.map((acc) => {
        if (acc.id === accessoryId) return { ...acc, equipped: isEquipping };
        // Unequip all others when equipping this one
        if (isEquipping && acc.equipped) return { ...acc, equipped: false };
        return acc;
      });
    } else {
      const accessoryInfo = ACCESSORIES[accessoryId];
      if (accessoryInfo) {
        newAccessories = [
          ...currentAccessories,
          {
            id: accessoryId,
            type: accessoryInfo.slot,
            name: accessoryInfo.name,
            icon: accessoryInfo.icon,
            equipped: true,
          },
        ];
      } else {
        newAccessories = currentAccessories;
      }
    }

    const optimisticPet = { ...pet, accessories: newAccessories };
    setPets((prev) => prev.map((p) => (p.id === pet.id ? optimisticPet : p)));

    try {
      const updatedPet = await petService.toggleAccessory(user.uid, pet.id, accessoryId);
      if (updatedPet) setPets((prev) => prev.map((p) => (p.id === updatedPet.id ? updatedPet : p)));
    } catch (error) {
      console.error('Error toggling accessory:', error);
      setPets((prev) => prev.map((p) => (p.id === pet.id ? pet : p)));
    }
  };

  const selectPet = async (idx: number) => {
    setSelectedPetIndex(idx);
    setActiveColorBorder(pets[idx].color);
    if (user) await petService.setActivePetId(user.uid, pets[idx].id);
  };

  const openCreateModal = () => setShowCreateModal(true);
  const closeCreateModal = () => setShowCreateModal(false);
  const openReleaseConfirm = () => setShowReleaseConfirm(true);
  const closeReleaseConfirm = () => setShowReleaseConfirm(false);

  return {
    // State
    pets,
    pet,
    selectedPetIndex,
    canAddNewPet,
    isLoading,
    showCreateModal,
    petName,
    selectedType,
    activeColorBorder,
    showReleaseConfirm,

    // Derived
    currentMood,
    hungerPercentage,
    happinessPercentage,
    experienceNeeded,
    experiencePercentage,
    isHealthy,
    xpBonusHint,

    // Setters
    setPetName,
    setSelectedType,

    // Actions
    createPet,
    feedPet,
    playWithPet,
    revivePet,
    releasePet,
    changeColor,
    toggleAccessory,
    selectPet,
    openCreateModal,
    closeCreateModal,
    openReleaseConfirm,
    closeReleaseConfirm,
  };
}
