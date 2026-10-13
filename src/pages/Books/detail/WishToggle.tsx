import { Redeem } from '@mui/icons-material';
import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { t } from '../../../services/i18n';

/** Wunschliste wie bei Steam: Freunde sehen gewünschte Bücher als Geschenkidee. */
export const WishToggle: React.FC<{ wished: boolean; busy?: boolean; onToggle: () => void }> = ({
  wished,
  busy,
  onToggle,
}) => {
  const { currentTheme } = useTheme();
  const color = currentTheme.status.warning;
  return (
    <button
      type="button"
      className={`bd-wish${wished ? ' bd-wish--on' : ''}`}
      disabled={busy}
      aria-pressed={wished}
      onClick={onToggle}
      style={{
        color: currentTheme.text.secondary,
        borderColor: wished ? `${color}99` : `${color}40`,
        background: wished
          ? `linear-gradient(140deg, ${color}38, ${color}12 70%)`
          : `linear-gradient(140deg, ${color}14, rgba(255,255,255,0.03) 70%)`,
      }}
    >
      <span className="bd-wish-icon" style={{ background: wished ? color : `${color}26` }}>
        <Redeem style={{ fontSize: 20, color: wished ? '#1a1206' : color }} />
      </span>
      <span className="bd-wish-text">
        <span className="bd-wish-label">
          {wished ? t('Auf deiner Wunschliste') : t('Auf die Wunschliste')}
        </span>
        <span className="bd-wish-hint" style={{ color: currentTheme.text.muted }}>
          {wished
            ? t('Freunde sehen es als Geschenkidee · Tippen zum Entfernen')
            : t('Freunde sehen es als Geschenkidee')}
        </span>
      </span>
    </button>
  );
};
