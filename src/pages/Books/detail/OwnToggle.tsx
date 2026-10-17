import { LibraryBooks } from '@mui/icons-material';
import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { t } from '../../../services/i18n';

/** „Im Besitz": Freunde sehen, dass du das Buch physisch besitzt. */
export const OwnToggle: React.FC<{ owned: boolean; onToggle: () => void }> = ({
  owned,
  onToggle,
}) => {
  const { currentTheme } = useTheme();
  const color = currentTheme.status.success;
  return (
    <button
      type="button"
      className={`bd-wish${owned ? ' bd-wish--on' : ''}`}
      aria-pressed={owned}
      onClick={onToggle}
      style={{
        color: currentTheme.text.secondary,
        borderColor: owned ? `${color}99` : `${color}40`,
        background: owned
          ? `linear-gradient(140deg, ${color}38, ${color}12 70%)`
          : `linear-gradient(140deg, ${color}14, rgba(255,255,255,0.03) 70%)`,
      }}
    >
      <span className="bd-wish-icon" style={{ background: owned ? color : `${color}26` }}>
        <LibraryBooks style={{ fontSize: 20, color: owned ? '#06140b' : color }} />
      </span>
      <span className="bd-wish-text">
        <span className="bd-wish-label">{owned ? t('Im Besitz') : t('Als Besitz markieren')}</span>
        <span className="bd-wish-hint" style={{ color: currentTheme.text.muted }}>
          {owned
            ? t('Freunde sehen, dass du es besitzt · Tippen zum Entfernen')
            : t('Freunde sehen, dass du es besitzt')}
        </span>
      </span>
    </button>
  );
};
