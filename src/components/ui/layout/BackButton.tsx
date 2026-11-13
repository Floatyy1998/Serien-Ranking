import { ArrowBack } from '@mui/icons-material';
import * as React from 'react';
import { useBackNavigation } from '../../../hooks/ui/useBackNavigation';
import { t } from '../../../services/i18n';
import { IconButton } from '../input/IconButton';

interface BackButtonProps {
  label?: string;
  style?: React.CSSProperties;
  showHome?: boolean;
  onBack?: () => void;
}

export const HomeLogoIcon = () => (
  <div
    style={{
      width: '18px',
      height: '18px',
      backgroundColor: 'var(--color-primary)',
      WebkitMaskImage: 'url(/tv-logo.svg)',
      maskImage: 'url(/tv-logo.svg)',
      WebkitMaskSize: 'contain',
      maskSize: 'contain' as string,
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat' as string,
      WebkitMaskPosition: 'center',
      maskPosition: 'center' as string,
    }}
  />
);

export const BackButton = ({ label, style, showHome = true, onBack }: BackButtonProps) => {
  const { goBack, goHome, homeLabel } = useBackNavigation();

  return (
    // data-back-button: die mitwandernde Leiste blendet Zurück/Home nur ein, solange keiner davon sichtbar ist
    <div
      data-back-button
      style={{ display: 'flex', alignItems: 'center', alignSelf: 'flex-start', gap: '6px' }}
    >
      <IconButton
        icon={<ArrowBack style={{ fontSize: '20px' }} />}
        onClick={onBack ?? goBack}
        size={42}
        borderRadius="50%"
        variant="glass"
        ariaLabel={label || t('Zurück')}
        tooltip={t('Zurück')}
        style={style}
      />
      {showHome && (
        <IconButton
          icon={<HomeLogoIcon />}
          onClick={goHome}
          size={42}
          borderRadius="50%"
          variant="glass"
          ariaLabel={homeLabel}
          tooltip={homeLabel}
          style={style}
        />
      )}
    </div>
  );
};
