import CardGiftcardRounded from '@mui/icons-material/CardGiftcardRounded';
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { IconContainer } from '../../components/ui';
import { InviteSheet } from '../../components/invite/InviteSheet';
import { t } from '../../services/i18n';
import { hapticTap } from '../../lib/interaction/haptics';

export const InviteAppBanner = () => {
  const { currentTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          hapticTap();
          setOpen(true);
        }}
        className="activity-banner activity-banner--inline"
        style={{
          background: `linear-gradient(135deg, ${currentTheme.primary}1f, ${currentTheme.accent}1f)`,
          border: `1px solid ${currentTheme.primary}33`,
        }}
      >
        <IconContainer color={currentTheme.primary} secondaryColor={currentTheme.accent} size={42}>
          <CardGiftcardRounded style={{ fontSize: '21px', color: '#fff' }} />
        </IconContainer>

        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            className="activity-banner__text-title"
            style={{ display: 'block', color: currentTheme.text.secondary }}
          >
            {t('Freunde einladen')}
          </span>
          <span
            className="activity-banner__text-sub"
            style={{ display: 'block', color: currentTheme.text.muted }}
          >
            {t('Ihr bekommt beide ein exklusives Accessoire')}
          </span>
        </span>
      </button>
      <InviteSheet isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};
