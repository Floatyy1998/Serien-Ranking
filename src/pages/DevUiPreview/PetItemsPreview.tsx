import { useTheme } from '../../contexts/ThemeContext';
import { PetItemsPanel } from '../Pets/PetItemsPanel';
import { PetReviveConfirm } from '../Pets/PetReviveConfirm';
import { StreakShieldDialog } from '../HomePage/sheets/StreakShieldDialog';
import { makeDevPet } from './devPets';

/** Vorrats-Liste mit allen sieben Verbrauchsgütern, daneben der leere Zustand. */
export const PetItemsPreview = () => {
  const { currentTheme } = useTheme();
  const card = {
    width: 260,
    borderRadius: 16,
    background: currentTheme.background.card,
    border: `1px solid ${currentTheme.border.default}`,
    overflow: 'hidden',
  } as const;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: 16 }}>
      <div style={card}>
        <PetItemsPanel
          items={{
            treat: 3,
            toy: 1,
            feast: 2,
            extraSpin: 1,
            bonusBox: 2,
            streakPass: 1,
            elixir: 1,
          }}
          pet={makeDevPet('otter', 12)}
          onUseItem={async () => true}
          onOpenBonusBox={() => {}}
        />
      </div>
      <div style={card}>
        <PetItemsPanel
          items={{
            treat: 0,
            toy: 0,
            feast: 0,
            extraSpin: 0,
            bonusBox: 0,
            streakPass: 0,
            elixir: 0,
          }}
          onOpenBonusBox={() => {}}
        />
      </div>
    </div>
  );
};

export const PetReviveElixirPreview = () => (
  <PetReviveConfirm
    pet={makeDevPet('hedgehog', 14, { name: 'Stachel', isAlive: false })}
    show
    elixirs={2}
    onClose={() => {}}
    onConfirm={() => {}}
  />
);

export const StreakPassPreview = () => (
  <StreakShieldDialog
    showConfirm
    freePass
    pet={null}
    streak={{ currentStreak: 23, longestStreak: 40, lastWatchDate: '2026-11-22' }}
    flameColor="#f59e0b"
    shieldLoading={false}
    onClose={() => {}}
    onActivate={() => {}}
  />
);
