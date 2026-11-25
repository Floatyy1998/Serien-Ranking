import { useState } from 'react';
import {
  PET_ITEM_IDS,
  PET_ITEMS,
  type PetItemCounts,
  type PetItemId,
} from '../../components/pet/data/petItems';
import { PetItemIcon } from '../../components/pet/PetItemIcon';
import { useTheme } from '../../contexts/ThemeContext';
import { showToast } from '../../lib/interaction/toast';
import { t } from '../../services/i18n';
import { RARITY_COLORS } from '../../types/pet.types';

export type DirectItemId = 'treat' | 'toy' | 'feast';

const isDirect = (id: PetItemId): id is DirectItemId =>
  id === 'treat' || id === 'toy' || id === 'feast';

interface PetItemsPanelProps {
  items: PetItemCounts;
  onUseItem?: (id: DirectItemId) => Promise<boolean>;
  onOpenBonusBox: () => void;
}

/** Vorrat an Verbrauchsgütern: was da ist, was es tut und wo es eingelöst wird. */
export const PetItemsPanel = ({ items, onUseItem, onOpenBonusBox }: PetItemsPanelProps) => {
  const { currentTheme } = useTheme();
  const [busy, setBusy] = useState(false);
  const owned = PET_ITEM_IDS.filter((id) => items[id] > 0);

  const redeem = async (id: DirectItemId) => {
    if (!onUseItem || busy) return;
    setBusy(true);
    const done = await onUseItem(id);
    setBusy(false);
    if (!done) {
      showToast(t('Das geht gerade nicht.'), 2500, 'error');
      return;
    }
    showToast(
      id === 'feast'
        ? t('Alle Pets sind satt und glücklich.')
        : id === 'treat'
          ? t('Alle Pets sind satt.')
          : t('Alle Pets sind glücklich.'),
      2500
    );
  };

  if (owned.length === 0) {
    return (
      <div
        style={{
          padding: '16px 10px 20px',
          textAlign: 'center',
          color: currentTheme.text.muted,
          fontSize: 13,
        }}
      >
        {t('Keine Vorräte vorhanden.')}
        <br />
        <span style={{ fontSize: 11, opacity: 0.7 }}>
          {t("Vorräte gibt's am Glücksrad & in Mystery Boxen!")}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 10 }}>
      {owned.map((id) => {
        const def = PET_ITEMS[id];
        const color = RARITY_COLORS[def.rarity];
        const action = isDirect(id)
          ? onUseItem
            ? { label: t('Benutzen'), run: () => void redeem(id) }
            : null
          : id === 'bonusBox'
            ? { label: t('Öffnen'), run: onOpenBonusBox }
            : null;

        // Die ganze Zeile ist der Knopf (wie bei den Boosts darüber), sonst bläht die
        // 44px-Mindesthöhe für Knöpfe einen kleinen Knopf in der Zeile auf.
        const Row = action ? 'button' : 'div';
        return (
          <Row
            key={id}
            {...(action ? { type: 'button' as const, onClick: action.run, disabled: busy } : {})}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '8px 10px',
              borderRadius: 10,
              border: `1px solid ${currentTheme.border.default}`,
              background: currentTheme.background.surface,
              textAlign: 'left',
              font: 'inherit',
              cursor: action && !busy ? 'pointer' : 'default',
              opacity: action && busy ? 0.5 : 1,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${color}, ${color}aa)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PetItemIcon id={id} style={{ fontSize: 16, color: '#1a1a2e' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: currentTheme.text.primary }}>
                {t(def.name)} <span style={{ color, fontWeight: 800 }}>×{items[id]}</span>
              </div>
              <div style={{ fontSize: 10, lineHeight: 1.3, color: currentTheme.text.muted }}>
                {t(action || !def.hint ? def.description : def.hint)}
              </div>
            </div>
            {action && (
              <span
                style={{
                  flexShrink: 0,
                  padding: '5px 9px',
                  borderRadius: 8,
                  background: `${currentTheme.primary}26`,
                  color: currentTheme.primary,
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {action.label}
              </span>
            )}
          </Row>
        );
      })}
    </div>
  );
};
