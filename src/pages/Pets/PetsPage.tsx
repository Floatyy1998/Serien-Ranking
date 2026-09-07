/** Kompositions-Komponente — Logik in usePetsData, UI in Subkomponenten. */

import { Pets } from '@mui/icons-material';
import React, { useState } from 'react';
import { LoadingSpinner, PageHeader } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { usePetEnabled } from '../../hooks/pet/usePetEnabled';
import { t } from '../../services/i18n';
import { setPetEnabled } from '../../services/pet/petPreferences';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { PetActions } from './PetActions';
import { PetCard } from './PetCard';
import { PetCreationModal } from './PetCreationModal';
import { PetCustomization } from './PetCustomization';
import { XpBoostHeaderButton } from './XpBoostHeaderButton';
import { PetReleaseConfirm } from './PetReleaseConfirm';
import { PetReviveConfirm } from './PetReviveConfirm';
import { PetSelector } from './PetSelector';
import { usePetsData } from './usePetsData';
import './PetsPage.css';

export const PetsPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const petEnabled = usePetEnabled();
  const [enabling, setEnabling] = useState(false);

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
    showReviveConfirm,
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
    equipBackground,
    selectPet,
    openCreateModal,
    openReleaseConfirm,
    closeReleaseConfirm,
    openReviveConfirm,
    closeReviveConfirm,
  } = usePetsData(petEnabled);

  const enablePet = async () => {
    if (!user || enabling) return;
    setEnabling(true);
    try {
      await setPetEnabled(user.uid, true);
    } catch (error) {
      console.error('Enabling pet failed:', error);
    } finally {
      setEnabling(false);
    }
  };

  if (!petEnabled) {
    return (
      <div className="pet-page" style={{ background: currentTheme.background.default }}>
        <PageHeader
          title={t('Meine Pets')}
          gradientFrom={currentTheme.accent}
          gradientTo={currentTheme.primary}
        />
        <div
          className="pet-disabled-card"
          style={{
            background: currentTheme.background.surface,
            borderColor: currentTheme.border.default,
          }}
        >
          <Pets style={{ fontSize: '40px', color: currentTheme.primary }} />
          <h2 className="pet-disabled-title" style={{ color: currentTheme.text.primary }}>
            {t('Dein Pet ist ausgeschaltet')}
          </h2>
          <p className="pet-disabled-text" style={{ color: currentTheme.text.muted }}>
            {t('Solange steht die Zeit für dein Pet still. Schalte es ein, um weiterzuspielen.')}
          </p>
          <button
            type="button"
            className="pet-disabled-cta"
            onClick={enablePet}
            disabled={enabling || !user}
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
              color: getOptimalTextColor(currentTheme.primary),
              opacity: enabling ? 0.7 : 1,
            }}
          >
            {t('Pet einschalten')}
          </button>
        </div>
      </div>
    );
  }

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
        title={t('Meine Pets')}
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
      <PetActions pet={pet} onFeed={feedPet} onPlay={playWithPet} onRevive={openReviveConfirm} />

      {/* Customization: Colors, Accessories, Backgrounds */}
      <PetCustomization
        pet={pet}
        activeColorBorder={activeColorBorder}
        onChangeColor={changeColor}
        onToggleAccessory={toggleAccessory}
        onEquipBackground={equipBackground}
      />

      {/* Release Button */}
      <div className="pet-release-footer">
        <button
          onClick={openReleaseConfirm}
          className="pet-release-trigger"
          style={{ color: currentTheme.text.muted }}
        >
          {t('Zur Adoption freigeben')}
        </button>
      </div>

      {/* Release Confirmation Modal */}
      <PetReleaseConfirm
        pet={pet}
        show={showReleaseConfirm}
        onClose={closeReleaseConfirm}
        onConfirm={releasePet}
      />

      {/* Revive Confirmation Modal (zeigt die Level-Kosten vorher an) */}
      <PetReviveConfirm
        pet={pet}
        show={showReviveConfirm}
        onClose={closeReviveConfirm}
        onConfirm={revivePet}
      />
    </div>
  );
};
