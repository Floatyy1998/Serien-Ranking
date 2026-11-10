import { Check, Close, DoneAll, RemoveDone } from '@mui/icons-material';
import React from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import './SelectionBar.css';

export interface SelectionAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  /** Hervorgehoben (erste Wahl der Leiste). */
  primary?: boolean;
}

interface SelectionBarProps {
  count: number;
  total: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onClose: () => void;
  actions: SelectionAction[];
  busy?: boolean;
}

/** Schwebende Leiste über dem Dock, solange eine Mehrfachauswahl läuft. */
export const SelectionBar: React.FC<SelectionBarProps> = ({
  count,
  total,
  allSelected,
  onToggleAll,
  onClose,
  actions,
  busy = false,
}) => {
  const { currentTheme } = useTheme();
  const muted = currentTheme.text.muted;
  const idle = count === 0 || busy;

  return createPortal(
    <div
      className="sel-bar"
      role="toolbar"
      aria-label={t('Auswahl')}
      style={{
        background: currentTheme.background.dialog,
        borderColor: `${currentTheme.primary}40`,
        color: currentTheme.text.secondary,
      }}
    >
      <div className="sel-bar-head">
        <button
          type="button"
          className="sel-bar-icon"
          onClick={onClose}
          aria-label={t('Auswahl beenden')}
          style={{ color: muted }}
        >
          <Close style={{ fontSize: 20 }} />
        </button>
        <span className="sel-bar-count" aria-live="polite">
          {count === 0
            ? t('Titel antippen zum Auswählen')
            : t('{n} von {total} ausgewählt', { n: count, total })}
        </span>
        <button
          type="button"
          className="sel-bar-all"
          onClick={onToggleAll}
          disabled={total === 0}
          style={{ color: currentTheme.primary }}
        >
          {allSelected ? (
            <RemoveDone style={{ fontSize: 18 }} />
          ) : (
            <DoneAll style={{ fontSize: 18 }} />
          )}
          {allSelected ? t('Keine') : t('Alle')}
        </button>
      </div>
      <div className="sel-bar-actions">
        {actions.map((action) => {
          const disabled = idle || action.disabled;
          return (
            <button
              key={action.key}
              type="button"
              className="sel-bar-action"
              onClick={action.onClick}
              disabled={disabled}
              style={{
                color: action.primary ? currentTheme.primary : currentTheme.text.secondary,
                background: action.primary ? `${currentTheme.primary}1f` : `${muted}14`,
                opacity: disabled ? 0.4 : 1,
              }}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
};

/** Kreis oben rechts auf einer Karte im Auswahlmodus. */
export const SelectCheck: React.FC<{ on: boolean }> = ({ on }) => {
  const { currentTheme } = useTheme();
  return (
    <span
      className={`sel-check${on ? ' sel-check--on' : ''}`}
      aria-hidden
      style={on ? { background: currentTheme.primary } : undefined}
    >
      {on && <Check style={{ fontSize: 16, color: getOptimalTextColor(currentTheme.primary) }} />}
    </span>
  );
};
