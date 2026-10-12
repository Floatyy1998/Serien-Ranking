/** Kompositions-Komponente — Logik in usePetsData, UI in Subkomponenten. */

import { AutoAwesome, Checkroom, Pets } from '@mui/icons-material';
import React, { useState, type ReactNode } from 'react';
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
import { PetDockPicker } from './PetDockPicker';
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

  const data = usePetsData(petEnabled);
  const { isLoading, showCreateModal, petName, selectedType, setPetName, setSelectedType } = data;
  const { createPet, pet } = data;

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

  return <PetsPageView data={data} />;
};

export type PetsPageData = ReturnType<typeof usePetsData>;

type Section = 'tricks' | 'wardrobe' | 'dock';

/** Die eigentliche Seite; die Vorschau unter /dev/ui-preview füttert sie mit Testdaten. */
export const PetsPageView: React.FC<{ data: PetsPageData }> = ({ data }) => {
  const { currentTheme } = useTheme();
  const {
    pets,
    pet,
    selectedPetIndex,
    canAddNewPet,
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
    feedPet,
    playWithPet,
    cheerUpPet,
    revivePet,
    releasePet,
    changeColor,
    toggleAccessory,
    equipBackground,
    selectPet,
    toggleDock,
    dockIds,
    openCreateModal,
    openReleaseConfirm,
    closeReleaseConfirm,
    openReviveConfirm,
    closeReviveConfirm,
  } = data;
  const [section, setSection] = useState<Section>('tricks');
  const [trickHost, setTrickHost] = useState<HTMLDivElement | null>(null);
  if (!pet) return null;

  const sections = (
    [
      pet.isAlive && { id: 'tricks', label: t('Tricks'), icon: <AutoAwesome /> },
      { id: 'wardrobe', label: t('Garderobe'), icon: <Checkroom /> },
      pets.length > 1 && { id: 'dock', label: t('Dock'), icon: <Pets /> },
    ] as const
  ).filter(Boolean) as { id: Section; label: string; icon: ReactNode }[];
  const current = sections.some((s) => s.id === section) ? section : sections[0].id;

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
        onPlayed={cheerUpPet}
        trickHost={current === 'tricks' ? trickHost : null}
      />

      <PetActions pet={pet} onFeed={feedPet} onPlay={playWithPet} onRevive={openReviveConfirm} />

      {/* Bereiche statt einer langen Liste */}
      <div className="pet-sections" role="tablist" aria-label={t('Bereiche')}>
        {sections.map((s) => {
          const active = s.id === current;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`pet-section-tab${active ? ' is-active' : ''}`}
              onClick={() => setSection(s.id)}
              style={
                active
                  ? {
                      background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                      borderColor: 'transparent',
                      color: getOptimalTextColor(currentTheme.primary),
                      boxShadow: `0 4px 16px ${currentTheme.primary}40`,
                    }
                  : {
                      background: currentTheme.background.surface,
                      borderColor: currentTheme.border.default,
                      color: currentTheme.text.secondary,
                    }
              }
            >
              {s.icon}
              {s.label}
            </button>
          );
        })}
      </div>

      {current === 'tricks' && <div ref={setTrickHost} className="pet-section-body" />}

      {current === 'wardrobe' && (
        <PetCustomization
          pet={pet}
          activeColorBorder={activeColorBorder}
          onChangeColor={changeColor}
          onToggleAccessory={toggleAccessory}
          onEquipBackground={equipBackground}
        />
      )}

      {current === 'dock' && (
        <PetDockPicker pets={pets} activeId={pet.id} dockIds={dockIds} onToggle={toggleDock} />
      )}

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
