import IosShareRounded from '@mui/icons-material/IosShareRounded';
import { useCallback, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { IconContainer } from '../../components/ui';
import { t } from '../../services/i18n';
import { shareLink } from '../../services/share/shareLink';
import { hapticSuccess } from '../../lib/interaction/haptics';
import { showToast } from '../../lib/interaction/toast';

// Startseite bietet je Geraet Store oder Browser an, Universal Link oeffnet die App.
export const APP_INVITE_URL = 'https://tv-rank.de';

export const InviteAppBanner = () => {
  const { currentTheme } = useTheme();
  const [busy, setBusy] = useState(false);

  const handleShare = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await shareLink({
        url: APP_INVITE_URL,
        title: 'TV-Rank',
        text: t(
          'Ich tracke meine Serien, Filme und Bücher mit TV-Rank. Kostenlos für iPhone, Android und im Browser:'
        ),
      });
      if (result === 'shared') {
        hapticSuccess();
      } else if (result === 'copied') {
        hapticSuccess();
        showToast(t('Link kopiert!'), 3000);
      } else if (result === 'failed') {
        showToast(t('Teilen nicht möglich'), 3000);
      }
    } finally {
      setBusy(false);
    }
  }, [busy]);

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      disabled={busy}
      className="activity-banner activity-banner--inline"
      style={{
        background: `linear-gradient(135deg, ${currentTheme.primary}1f, ${currentTheme.accent}1f)`,
        border: `1px solid ${currentTheme.primary}33`,
      }}
    >
      <IconContainer color={currentTheme.primary} secondaryColor={currentTheme.accent} size={42}>
        <IosShareRounded style={{ fontSize: '21px', color: '#fff' }} />
      </IconContainer>

      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          className="activity-banner__text-title"
          style={{ display: 'block', color: currentTheme.text.secondary }}
        >
          {t('TV-Rank weiterempfehlen')}
        </span>
        <span
          className="activity-banner__text-sub"
          style={{ display: 'block', color: currentTheme.text.muted }}
        >
          {t('Link per WhatsApp, Mail oder SMS verschicken')}
        </span>
      </span>
    </button>
  );
};
