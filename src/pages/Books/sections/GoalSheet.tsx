import React, { useState } from 'react';
import { BottomSheet } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';

const PRESETS = [6, 12, 24, 52];

export const GoalSheet: React.FC<{
  open: boolean;
  initial: number;
  year: number;
  onClose: () => void;
  onSave: (goal: number) => void;
}> = ({ open, initial, year, onClose, onSave }) => {
  const { currentTheme } = useTheme();
  const [value, setValue] = useState(initial || 12);
  return (
    <BottomSheet isOpen={open} onClose={onClose} ariaLabel={t('Leseziel')}>
      <div className="bk-sheet" style={{ alignItems: 'center', textAlign: 'center' }}>
        <h3 className="bk-sheet-title" style={{ color: currentTheme.text.secondary }}>
          {t('Wie viele Bücher willst du {year} lesen?', { year })}
        </h3>
        <input
          className="bk-page-input"
          type="number"
          inputMode="numeric"
          min={1}
          max={365}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          onFocus={(e) => e.currentTarget.select()}
          style={{ color: currentTheme.text.secondary, borderColor: `${currentTheme.primary}88` }}
          aria-label={t('Leseziel')}
        />
        <div className="bk-chip-row">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className="bk-chip-btn"
              onClick={() => setValue(p)}
              style={{
                color: currentTheme.text.secondary,
                borderColor: value === p ? currentTheme.primary : undefined,
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          {initial > 0 && (
            <button
              type="button"
              className="bk-cta bk-cta--ghost"
              style={{ flex: 1, color: currentTheme.text.secondary }}
              onClick={() => onSave(0)}
            >
              {t('Ziel entfernen')}
            </button>
          )}
          <button
            type="button"
            className="bk-cta"
            style={{
              flex: 1,
              color: getOptimalTextColor(currentTheme.primary),
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            }}
            onClick={() => onSave(Math.max(1, Math.min(365, Math.round(value) || 1)))}
          >
            {t('Ziel speichern')}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
