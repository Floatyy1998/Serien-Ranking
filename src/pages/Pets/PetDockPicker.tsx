import { Check } from '@mui/icons-material';
import { memo } from 'react';
import { EvolvingPixelPet } from '../../components/pet';
import { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';
import { MAX_DOCK_PETS } from '../../services/pet/petConstants';
import type { Pet } from '../../types/pet.types';
import './PetsPage.css';

interface Props {
  pets: Pet[];
  activeId: string;
  dockIds: string[];
  onToggle: (petId: string) => void;
}

/** Bis zu drei Pets laufen gemeinsam über das Dock: das aktive plus zwei Begleiter. */
export const PetDockPicker = memo(function PetDockPicker({
  pets,
  activeId,
  dockIds,
  onToggle,
}: Props) {
  const { currentTheme } = useTheme();
  if (pets.length < 2) return null;

  const onDock = (p: Pet) => p.id === activeId || dockIds.includes(p.id);
  const count = pets.filter(onDock).length;
  const full = count >= MAX_DOCK_PETS;

  return (
    <section className="pet-dock-picker">
      <div className="pet-dock-picker__head">
        <span className="pet-dock-picker__title" style={{ color: currentTheme.text.primary }}>
          {t('Auf dem Dock')}
        </span>
        <span className="pet-dock-picker__meta" style={{ color: currentTheme.text.muted }}>
          {t('{n} von {total}', { n: count, total: MAX_DOCK_PETS })}
        </span>
      </div>
      <p className="pet-dock-picker__sub" style={{ color: currentTheme.text.muted }}>
        {t('Bis zu drei Pets laufen zusammen über die Leiste und spielen miteinander.')}
      </p>
      <div className="pet-dock-picker__list">
        {pets.map((p) => {
          const active = p.id === activeId;
          const on = onDock(p);
          const blocked = !on && full;
          const dead = !p.isAlive;
          const state = active
            ? t('Aktiv')
            : dead
              ? t('Braucht Hilfe')
              : on
                ? t('Dabei')
                : blocked
                  ? t('Dock voll')
                  : t('Dazuholen');
          return (
            <button
              key={p.id}
              type="button"
              className={`pet-dock-picker__pet${on ? ' is-on' : ''}`}
              aria-pressed={on}
              disabled={active || blocked || (dead && !on)}
              onClick={() => onToggle(p.id)}
              style={{
                background: on ? `${currentTheme.primary}1a` : currentTheme.background.surface,
                borderColor: on ? `${currentTheme.primary}80` : currentTheme.border.default,
              }}
            >
              {on && (
                <span
                  className="pet-dock-picker__check"
                  style={{
                    background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                    color: currentTheme.background.default,
                  }}
                >
                  <Check />
                </span>
              )}
              <span
                className="pet-dock-picker__sprite"
                style={dead ? { filter: 'grayscale(1)' } : undefined}
              >
                <EvolvingPixelPet pet={p} size={52} animated={false} />
              </span>
              <span className="pet-dock-picker__name" style={{ color: currentTheme.text.primary }}>
                {p.name}
              </span>
              <span
                className="pet-dock-picker__state"
                style={{ color: on ? currentTheme.primary : currentTheme.text.muted }}
              >
                {state}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
});
