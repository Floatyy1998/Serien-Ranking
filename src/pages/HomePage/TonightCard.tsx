import ChevronRight from '@mui/icons-material/ChevronRight';
import NightsStay from '@mui/icons-material/NightsStay';
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { TonightSheet } from '../../components/tonight/TonightSheet';
import { IconContainer, NavCard } from '../../components/ui';
import { t } from '../../services/i18n';

export const TonightCard: React.FC = () => {
  const { currentTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const accent = currentTheme.primary;

  return (
    <>
      <NavCard
        onClick={() => setOpen(true)}
        accentColor={accent}
        aria-label={t('Heute Abend: Ein Vorschlag nach Zeit und Stimmung')}
      >
        <IconContainer color={accent} secondaryColor={currentTheme.accent}>
          <NightsStay style={{ fontSize: 20, color: 'white' }} />
        </IconContainer>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              color: currentTheme.text.primary,
              whiteSpace: 'nowrap',
            }}
          >
            {t('Heute Abend')}
          </h2>
          <p
            style={{
              margin: '1px 0 0',
              fontSize: 12,
              color: currentTheme.text.secondary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {t('Ein Vorschlag nach Zeit und Stimmung')}
          </p>
        </div>

        <ChevronRight
          style={{ color: currentTheme.text.secondary, fontSize: 20 }}
          aria-hidden="true"
        />
      </NavCard>

      <TonightSheet isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default TonightCard;
