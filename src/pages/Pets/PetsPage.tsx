/**
 * PetsPage - Premium Virtual Pet Experience
 * Slim composition component - business logic in usePetsData, JSX in subcomponents
 */

import React from 'react';
import { LoadingSpinner, PageHeader } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContextDef';
import { PetActions } from './PetActions';
import { PetCard } from './PetCard';
import { PetCreationModal } from './PetCreationModal';
import { PetCustomization } from './PetCustomization';
import { XpBoostHeaderButton } from './XpBoostHeaderButton';
import { PetReleaseConfirm } from './PetReleaseConfirm';
import { PetSelector } from './PetSelector';
import { usePetsData } from './usePetsData';
import './PetsPage.css';

export const PetsPage: React.FC = () => {
  const { currentTheme } = useTheme();

  const {
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
    currentMood,
    hungerPercentage,
    happinessPercentage,
    experienceNeeded,
    experiencePercentage,
    isHealthy,
    xpBonusHint,
    setPetName,
    setSelectedType,
    createPet,
    feedPet,
    playWithPet,
    revivePet,
    releasePet,
    changeColor,
    toggleAccessory,
    selectPet,
    openCreateModal,
    openReleaseConfirm,
    closeReleaseConfirm,
  } = usePetsData();

  // Loading State
  if (isLoading) {
    return (
      <div className="pet-loading" style={{ background: currentTheme.background.default }}>
        <LoadingSpinner size={56} />
      </div>
    );
  }

  // Create Pet Modal
  if (showCreateModal) {
    return (
      <PetCreationModal
        petName={petName}
        selectedType={selectedType}
        onNameChange={setPetName}
        onTypeChange={setSelectedType}
        onCreatePet={createPet}
      />
    );
  }

  if (!pet) return null;

  return (
    <div className="pet-page" style={{ background: currentTheme.background.default }}>
      {/* Header */}
      <PageHeader
        title="Meine Pets"
        gradientFrom={currentTheme.accent}
        gradientTo={currentTheme.primary}
        actions={<XpBoostHeaderButton />}
      />

      {/* Pet Selector */}
      <PetSelector
        pets={pets}
        selectedPetIndex={selectedPetIndex}
        canAddNewPet={canAddNewPet}
        onSelectPet={selectPet}
        onOpenCreateModal={openCreateModal}
      />

      {/* Pet Card: name, display, stats, XP bonus */}
      <PetCard
        pet={pet}
        currentMood={currentMood ?? undefined}
        hungerPercentage={hungerPercentage}
        happinessPercentage={happinessPercentage}
        experiencePercentage={experiencePercentage}
        experienceNeeded={experienceNeeded}
        isHealthy={isHealthy}
        xpBonusHint={xpBonusHint}
      />

      {/* Action Buttons */}
      <PetActions pet={pet} onFeed={feedPet} onPlay={playWithPet} onRevive={revivePet} />

      {/* Release Confirmation Modal */}
      <PetReleaseConfirm
        pet={pet}
        show={showReleaseConfirm}
        onClose={closeReleaseConfirm}
        onConfirm={releasePet}
      />

      {/* Customization: Colors & Accessories */}
      <PetCustomization
        pet={pet}
        activeColorBorder={activeColorBorder}
        onChangeColor={changeColor}
        onToggleAccessory={toggleAccessory}
      />

      {/* Release Button */}
      <div className="pet-release-footer">
        <button
          onClick={openReleaseConfirm}
          className="pet-release-trigger"
          style={{ color: currentTheme.text.muted }}
        >
          Zur Adoption freigeben
        </button>
      </div>
    </div>
  );
};
