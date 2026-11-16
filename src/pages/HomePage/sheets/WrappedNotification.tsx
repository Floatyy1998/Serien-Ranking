/**
 * WrappedNotification - Banner für Wrapped Jahresrückblick
 * Config wird aus Firebase gelesen (config/wrapped)
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowForwardRounded } from '@mui/icons-material';
import { useWrappedConfig } from '../../../hooks/wrapped/useWrappedConfig';
import { hapticTap } from '../../../lib/interaction/haptics';
import { t } from '../../../services/i18n';
import './WrappedNotification.css';

// Memo: parent re-renders constantly on unrelated state, but the banner
// only depends on useWrappedConfig via context — skip when it returned the
// same identity.
const WrappedNotificationImpl: React.FC = () => {
  const { enabled, year, loading } = useWrappedConfig();

  if (loading || !enabled) return null;

  return <WrappedBanner year={year} />;
};

/**
 * Der Banner selbst, ohne die Frage, ob Wrapped schon läuft. Dunkler Grund wie
 * die Wrapped-Folien: die Designfarben sind nur Leuchten und Rand, damit die
 * Schrift bei jedem Farbschema lesbar bleibt.
 */
export const WrappedBanner: React.FC<{ year: number }> = ({ year }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="wrapped-banner"
      onClick={() => {
        hapticTap();
        navigate('/wrapped');
      }}
      aria-label={t('Dein {year} Wrapped ist da – Entdecke deinen Jahresrückblick', { year })}
    >
      <span className="wrapped-banner__glow wrapped-banner__glow--a" aria-hidden />
      <span className="wrapped-banner__glow wrapped-banner__glow--b" aria-hidden />
      <span className="wrapped-banner__shine" aria-hidden />

      <span className="wrapped-banner__year">{year}</span>
      <span className="wrapped-banner__text">
        <span className="wrapped-banner__title">{t('Dein Wrapped ist da')}</span>
        <span className="wrapped-banner__sub">{t('Entdecke deinen Jahresrückblick')}</span>
      </span>
      <span className="wrapped-banner__go" aria-hidden>
        <ArrowForwardRounded />
      </span>
    </button>
  );
};

export const WrappedNotification = memo(WrappedNotificationImpl);
WrappedNotification.displayName = 'WrappedNotification';

export default WrappedNotification;
